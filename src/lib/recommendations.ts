import { createClient } from '@/lib/supabase/client'
import { GuestPreferences, MenuTag, TAG_LABELS } from './types/taxonomy'
import { DrinkPreferences } from './questions'

export interface RecommendedItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  tags: MenuTag[]
  popularity_score: number
  is_push: boolean
  reason: string
  score: number
  isFallback?: boolean
  isCrossSell?: boolean
}

export interface UnmetPreferences {
  items: string[]
  feedbackMessage: string | null
}

export interface RecommendationsResult {
  recommendations: RecommendedItem[]
  fallbackItems: RecommendedItem[]
  showFallbackMessage: boolean
  missingPreferences: {
    mood: string | null
    flavors: string[]
    dietary: string[]
  } | null
}

interface ScoredItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  tags: MenuTag[]
  popularity_score: number
  is_push: boolean
  score: number
  matchedTags: string[]
}

export async function createRecSession(venueId: string, tableRef: string | null): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('rec_sessions')
    .insert({
      venue_id: venueId,
      table_ref: tableRef,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create rec_session:', error?.message, error?.details, error?.hint, error)
    return null
  }

  return data.id
}

export async function trackEvent(
  venueId: string,
  sessionId: string,
  eventName: string,
  props: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('events')
    .insert({
      venue_id: venueId,
      session_id: sessionId,
      name: eventName,
      props,
      ts: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to track event:', error?.message)
  }
}

export async function saveRecResults(
  sessionId: string,
  recommendations: Array<{ id: string; score: number; reason: string }>
): Promise<void> {
  const supabase = createClient()

  const rows = recommendations.map((rec, index) => ({
    session_id: sessionId,
    item_id: rec.id,
    rank: index + 1,
    score: rec.score,
    reason: rec.reason,
    created_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('rec_results')
    .insert(rows)

  if (error) {
    console.error('Failed to save rec_results:', error?.message)
  }
}

export async function trackUnmetDemand(
  venueId: string,
  sessionId: string | null,
  preferences: GuestPreferences
): Promise<void> {
  const supabase = createClient()

  await supabase.from('events').insert({
    venue_id: venueId,
    session_id: sessionId,
    name: 'unmet_demand',
    props: {
      requested_mood: preferences.mood,
      requested_flavors: preferences.flavors,
      requested_dietary: preferences.dietary,
    },
    ts: new Date().toISOString(),
  })
}

// ── Helpers: Fetch menu items ──────────────────────────────────────────

interface RawItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  popularity_score: number
  is_push: boolean
  is_out_of_stock: boolean
  tags: string[]
}

async function fetchMenuItems(
  venueId: string,
  type: 'food' | 'drink'
): Promise<RawItem[]> {
  const supabase = createClient()

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .single()

  if (!menu) return []

  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      id, name, description, price, category, type,
      popularity_score, is_push, is_out_of_stock, is_available,
      item_tags (tag)
    `)
    .eq('menu_id', menu.id)
    .eq('is_available', true)
    .eq('type', type)

  if (!items) return []

  return items
    .filter(item => !item.is_out_of_stock)
    .map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      popularity_score: item.popularity_score || 0,
      is_push: item.is_push || false,
      is_out_of_stock: false,
      tags: (item.item_tags as { tag: string }[])?.map(t => t.tag) || [],
    }))
}

// ── Food Recommendations (updated scoring) ─────────────────────────────

export async function getRecommendations(
  venueId: string,
  preferences: GuestPreferences,
  count: number = 3
): Promise<RecommendedItem[]> {
  const result = await getRecommendationsWithFallback(venueId, preferences, count)
  return [...result.recommendations, ...result.fallbackItems.map(item => ({ ...item, isFallback: true }))]
}

export async function getRecommendationsWithFallback(
  venueId: string,
  preferences: GuestPreferences,
  count: number = 3
): Promise<RecommendationsResult> {
  const items = await fetchMenuItems(venueId, 'food')

  if (items.length === 0) {
    return { recommendations: [], fallbackItems: [], showFallbackMessage: false, missingPreferences: null }
  }

  const scored = scoreItems(items, preferences)

  // Get items with positive scores (actual matches)
  const topItems = scored
    .filter(item => item.score > 0)
    .slice(0, count)
    .map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      tags: item.tags as MenuTag[],
      popularity_score: item.popularity_score,
      is_push: item.is_push,
      reason: generateReasonString(item.matchedTags),
      score: item.score,
    }))

  // Fallback to popular items if not enough matches
  const fallbackItems: RecommendedItem[] = []
  const showFallbackMessage = topItems.length < count

  if (showFallbackMessage) {
    const usedIds = new Set(topItems.map(item => item.id))
    const remainingCount = count - topItems.length

    const popularFallbacks = items
      .filter(item => !usedIds.has(item.id))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, remainingCount)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        tags: item.tags as MenuTag[],
        popularity_score: item.popularity_score,
        is_push: item.is_push,
        reason: 'Popular with other guests',
        score: 0,
        isFallback: true,
      }))

    fallbackItems.push(...popularFallbacks)
  }

  return {
    recommendations: topItems,
    fallbackItems,
    showFallbackMessage,
    missingPreferences: showFallbackMessage
      ? { mood: preferences.mood, flavors: preferences.flavors, dietary: preferences.dietary }
      : null,
  }
}

function scoreItems(
  items: RawItem[],
  preferences: GuestPreferences
): ScoredItem[] {
  const scored = items.map(item => {
    let score = 0
    const matchedTags: string[] = []

    // ── DIETARY: EXCLUSIONARY (-1000) ──
    // If user has dietary needs, items MUST have those tags or be excluded
    if (preferences.dietary.length > 0) {
      const meetsAllDietary = preferences.dietary.every(diet => {
        if (diet === 'diet_vegetarian') {
          return item.tags.includes('diet_vegetarian') || item.tags.includes('diet_vegan')
        }
        return item.tags.includes(diet)
      })

      if (!meetsAllDietary) {
        return { ...item, tags: item.tags as unknown as MenuTag[], score: -1000, matchedTags: [] }
      }

      preferences.dietary.forEach(diet => {
        if (item.tags.includes(diet)) matchedTags.push(diet)
      })
    }

    // ── MOOD: +10 points ──
    if (preferences.mood && item.tags.includes(preferences.mood)) {
      score += 10
      matchedTags.push(preferences.mood)
    }

    // ── FLAVOR: +5 points per match ──
    preferences.flavors.forEach(flavor => {
      if (item.tags.includes(flavor)) {
        score += 5
        matchedTags.push(flavor)
      }
    })

    // ── PORTION: +8 points ──
    if (preferences.portion && item.tags.includes(preferences.portion)) {
      score += 8
      matchedTags.push(preferences.portion)
    }

    // ── PRICE: +2 points (optional) ──
    if (preferences.price && item.tags.includes(preferences.price)) {
      score += 2
      matchedTags.push(preferences.price)
    }

    // ── POPULARITY: +0.05 * score ──
    score += 0.05 * item.popularity_score

    // ── IS PUSH: +3 points ──
    if (item.is_push) {
      score += 3
    }

    return {
      ...item,
      tags: item.tags as unknown as MenuTag[],
      score,
      matchedTags,
    }
  })

  return scored
    .filter(item => item.score > -50)
    .sort((a, b) => b.score - a.score)
}

function generateReasonString(matchedTags: string[]): string {
  const parts: string[] = []

  // Mood
  const moodTag = matchedTags.find(t => t.startsWith('mood_'))
  if (moodTag) {
    const moodLabels: Record<string, string> = {
      mood_comfort: 'Comfort food',
      mood_light: 'Light & fresh',
      mood_protein: 'High-protein',
      mood_warm: 'Warm & cozy',
      mood_treat: 'Sweet indulgence',
    }
    parts.push(moodLabels[moodTag] || TAG_LABELS[moodTag as MenuTag])
  }

  // Flavors
  const flavorTags = matchedTags.filter(t => t.startsWith('flavor_'))
  flavorTags.forEach(flavor => {
    const flavorLabels: Record<string, string> = {
      flavor_umami: 'umami-rich',
      flavor_spicy: 'with a kick',
      flavor_sweet: 'sweet notes',
      flavor_tangy: 'tangy flavours',
      flavor_smoky: 'smoky depth',
    }
    parts.push(flavorLabels[flavor] || flavor)
  })

  // Portion
  const portionTag = matchedTags.find(t => t.startsWith('portion_'))
  if (portionTag) {
    const portionLabels: Record<string, string> = {
      portion_bite: 'perfect bite-size',
      portion_standard: '',
      portion_hearty: 'hearty portion',
    }
    const label = portionLabels[portionTag]
    if (label) parts.push(label)
  }

  // Dietary
  const dietTags = matchedTags.filter(t => t.startsWith('diet_') || t.startsWith('allergy_'))
  if (dietTags.length > 0) {
    const dietLabels = dietTags.slice(0, 1).map(d => TAG_LABELS[d as MenuTag] || d)
    parts.push(dietLabels.join(', '))
  }

  if (parts.length === 0) return "Chef's recommendation"

  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

// ── Drink Recommendations (NEW tag system) ─────────────────────────────

export interface NewDrinkPreferences {
  drinkMood?: string         // drink_mood_celebrate, drink_mood_unwind, etc.
  drinkFlavors?: string[]    // drink_flavor_fruity, drink_flavor_bitter, etc.
  drinkPreferences?: string[] // drink_non_alcoholic, drink_low_sugar, diet_vegan, drink_no_caffeine
}

export async function getNewDrinkRecommendations(
  venueId: string,
  preferences: NewDrinkPreferences,
  count: number = 3
): Promise<RecommendedItem[]> {
  const items = await fetchMenuItems(venueId, 'drink')

  if (items.length === 0) return []

  const exclusionary = (preferences.drinkPreferences || []).filter(
    p => p === 'drink_non_alcoholic' || p === 'diet_vegan'
  )

  const scored = items.map(item => {
    let score = 0
    const matchedTags: string[] = []

    // ── EXCLUSIONARY CHECKS (-1000) ──
    for (const tag of exclusionary) {
      if (!item.tags.includes(tag)) {
        return {
          ...item,
          tags: item.tags as unknown as MenuTag[],
          score: -1000,
          matchedTags: [],
        }
      }
    }

    // ── DRINK MOOD: +10 points ──
    if (preferences.drinkMood && item.tags.includes(preferences.drinkMood)) {
      score += 10
      matchedTags.push(preferences.drinkMood)
    }

    // ── DRINK FLAVOR: +5 points per match ──
    if (preferences.drinkFlavors) {
      preferences.drinkFlavors.forEach(flavor => {
        if (item.tags.includes(flavor)) {
          score += 5
          matchedTags.push(flavor)
        }
      })
    }

    // ── POPULARITY: +0.05 * score ──
    score += 0.05 * item.popularity_score

    // ── IS PUSH: +3 points ──
    if (item.is_push) {
      score += 3
    }

    return {
      ...item,
      tags: item.tags as unknown as MenuTag[],
      score,
      matchedTags,
    }
  })

  const sorted = scored
    .filter(item => item.score > -50)
    .sort((a, b) => b.score - a.score)

  return sorted.slice(0, count).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    tags: item.tags as MenuTag[],
    popularity_score: item.popularity_score,
    is_push: item.is_push,
    reason: generateDrinkReasonNew(item.matchedTags, preferences),
    score: item.score,
  }))
}

function generateDrinkReasonNew(matchedTags: string[], preferences: NewDrinkPreferences): string {
  const parts: string[] = []

  // Mood
  const moodLabels: Record<string, string> = {
    drink_mood_celebrate: 'Celebration pick',
    drink_mood_unwind: 'Perfect for unwinding',
    drink_mood_refresh: 'Light & refreshing',
    drink_mood_energize: 'Energizing',
    drink_mood_treat: 'Premium treat',
  }
  if (preferences.drinkMood && matchedTags.includes(preferences.drinkMood)) {
    parts.push(moodLabels[preferences.drinkMood] || 'Great match')
  }

  // Flavor
  const flavorLabels: Record<string, string> = {
    drink_flavor_fruity: 'fruity notes',
    drink_flavor_bitter: 'bitter complexity',
    drink_flavor_sweet: 'sweet & creamy',
    drink_flavor_dry: 'dry & crisp',
    drink_flavor_smoky: 'smoky depth',
  }
  if (preferences.drinkFlavors) {
    preferences.drinkFlavors.forEach(flavor => {
      if (matchedTags.includes(flavor)) {
        parts.push(flavorLabels[flavor] || flavor)
      }
    })
  }

  // Preferences
  if (preferences.drinkPreferences?.includes('drink_non_alcoholic') && matchedTags.includes('drink_non_alcoholic')) {
    parts.push('alcohol-free')
  }

  if (parts.length === 0) return 'Popular choice'

  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

// ── Legacy Drink Recommendations (keep for backward compatibility) ──────

export async function getDrinkRecommendations(
  venueId: string,
  preferences: DrinkPreferences,
  count: number = 3
): Promise<RecommendedItem[]> {
  const supabase = createClient()

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .single()

  if (!menu) return []

  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      id, name, description, price, category, type,
      popularity_score, is_push, is_out_of_stock, is_available,
      item_tags (tag)
    `)
    .eq('menu_id', menu.id)
    .eq('is_available', true)
    .eq('type', 'drink')

  if (!items) return []

  const drinkItems = items
    .filter(item => !item.is_out_of_stock)
    .map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      popularity_score: item.popularity_score || 0,
      is_push: item.is_push || false,
      tags: (item.item_tags as { tag: string }[])?.map(t => t.tag as MenuTag) || [],
    }))

  // ABV filtering
  let filteredDrinks = drinkItems
  const strengthPref = preferences.drinkStrength
  const isNonAlcoholic = strengthPref === 'strength_none' || strengthPref === 'abv_zero'
  const isLight = strengthPref === 'strength_light' || strengthPref === 'abv_light'

  if (isNonAlcoholic) {
    filteredDrinks = drinkItems.filter(drink => {
      const tagStrings = drink.tags as unknown as string[]
      const hasNonAlcTag = tagStrings.some(t => t === 'abv_zero' || t === 'strength_none' || t === 'non_alcoholic' || t === 'drink_non_alcoholic')
      const isNonAlcCat = ['mocktails', 'soft drinks', 'smoothies', 'coffee', 'tea', 'juice', 'hot drinks']
        .some(cat => drink.category?.toLowerCase().includes(cat))
      const hasAlcTag = tagStrings.some(t =>
        t === 'abv_light' || t === 'abv_regular' || t === 'abv_strong'
      )
      return (hasNonAlcTag || isNonAlcCat) && !hasAlcTag
    })
  } else if (isLight) {
    filteredDrinks = drinkItems.filter(drink => {
      const tagStrings = drink.tags as unknown as string[]
      const hasLightTag = tagStrings.some(t =>
        t === 'abv_light' || t === 'abv_zero' || t === 'strength_none' || t === 'strength_light'
      )
      const isLightCat = ['wines', 'wine', 'beers', 'beer', 'spritz', 'mocktails', 'soft drinks', 'cider', 'hot drinks', 'coffee', 'tea']
        .some(cat => drink.category?.toLowerCase().includes(cat))
      const isStrong = drink.category?.toLowerCase().includes('spirit') ||
        drink.category?.toLowerCase().includes('whiskey')
      return (hasLightTag || isLightCat) && !isStrong
    })
  }

  const scored = filteredDrinks.map(drink => {
    let score = 0
    const matchedTags: MenuTag[] = []

    if (preferences.drinkFeel) {
      if (preferences.drinkFeel === 'temp_hot' && drink.tags.includes('temp_hot' as MenuTag)) {
        score += 20
        matchedTags.push('temp_hot' as MenuTag)
      } else if (preferences.drinkFeel === 'format_crisp' && (drink.tags.includes('format_crisp' as MenuTag) || drink.tags.includes('temp_chilled' as MenuTag))) {
        score += 20
        matchedTags.push('format_crisp' as MenuTag)
      } else if (preferences.drinkFeel === 'format_sparkling' && drink.tags.includes('format_sparkling' as MenuTag)) {
        score += 20
        matchedTags.push('format_sparkling' as MenuTag)
      } else if (preferences.drinkFeel === 'format_creamy' && drink.tags.includes('format_creamy' as MenuTag)) {
        score += 20
        matchedTags.push('format_creamy' as MenuTag)
      }
    }

    if (preferences.drinkTaste && preferences.drinkTaste.length > 0) {
      preferences.drinkTaste.forEach(taste => {
        if (drink.tags.includes(taste as MenuTag)) {
          score += 10
          matchedTags.push(taste as MenuTag)
        }
      })
    }

    score += 0.05 * drink.popularity_score
    if (drink.is_push) score += 3

    return { ...drink, score, matchedTags }
  })

  const sorted = scored.sort((a, b) => b.score - a.score)

  return sorted.slice(0, count).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    tags: item.tags,
    popularity_score: item.popularity_score,
    is_push: item.is_push,
    reason: generateDrinkReasonLegacy(item.matchedTags, preferences),
    score: item.score,
  }))
}

function generateDrinkReasonLegacy(matchedTags: MenuTag[], preferences: DrinkPreferences): string {
  const parts: string[] = []

  if (preferences.drinkFeel === 'temp_hot' && matchedTags.some(t => t.includes('hot'))) {
    parts.push('Warming')
  } else if (preferences.drinkFeel === 'format_crisp') {
    parts.push('Refreshing')
  } else if (preferences.drinkFeel === 'format_sparkling') {
    parts.push('Bubbly')
  } else if (preferences.drinkFeel === 'format_creamy') {
    parts.push('Smooth & creamy')
  }

  if (preferences.drinkTaste && preferences.drinkTaste.length > 0) {
    if (preferences.drinkTaste.includes('flavor_sweet') && matchedTags.some(t => t.includes('sweet'))) {
      parts.push('sweet notes')
    }
    if (preferences.drinkTaste.includes('flavor_bitter') && matchedTags.some(t => t.includes('bitter'))) {
      parts.push('bitter complexity')
    }
  }

  const isNonAlcoholic = preferences.drinkStrength === 'strength_none' || preferences.drinkStrength === 'abv_zero'
  if (isNonAlcoholic) parts.push('alcohol-free')

  if (parts.length === 0) return 'Popular choice'

  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

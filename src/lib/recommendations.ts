import { createClient } from '@/lib/supabase/client'
import { GuestPreferences, MenuTag, TAG_LABELS, DietTag, FlavorTag } from './types/taxonomy'

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
  matchedTags: MenuTag[]
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
  console.log('[trackEvent] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[trackEvent] sessionId:', sessionId, 'name:', eventName)

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
    console.error('Failed to track event:', error?.message, error?.details, error?.hint, error)
  }
}

export async function saveRecResults(
  sessionId: string,
  recommendations: Array<{ id: string; score: number; reason: string }>
): Promise<void> {
  const supabase = createClient()

  // Insert one row per recommended item with rank
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
    console.error('Failed to save rec_results:', error?.message, error?.details, error?.hint, error)
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

export async function getRecommendations(
  venueId: string,
  preferences: GuestPreferences,
  count: number = 3
): Promise<RecommendedItem[]> {
  const result = await getRecommendationsWithFallback(venueId, preferences, count)
  // Combine recommendations and fallback items for backward compatibility
  return [...result.recommendations, ...result.fallbackItems.map(item => ({ ...item, isFallback: true }))]
}

export async function getRecommendationsWithFallback(
  venueId: string,
  preferences: GuestPreferences,
  count: number = 3
): Promise<RecommendationsResult> {
  const supabase = createClient()

  // 1. Get the published menu for this venue
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .single()

  if (menuError || !menu) {
    console.error('Failed to fetch menu:', menuError?.message, menuError?.details, menuError?.hint, menuError)
    return { recommendations: [], fallbackItems: [], showFallbackMessage: false, missingPreferences: null }
  }

  // 2. Get all menu items with their tags
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      category,
      popularity_score,
      is_push,
      is_out_of_stock,
      item_tags (tag)
    `)
    .eq('menu_id', menu.id)

  if (itemsError || !items) {
    console.error('Failed to fetch menu items:', itemsError?.message, itemsError?.details, itemsError?.hint, itemsError)
    return { recommendations: [], fallbackItems: [], showFallbackMessage: false, missingPreferences: null }
  }

  // 3. Transform items with tags
  const itemsWithTags = items
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

  // 4. Score and rank items
  const scored = scoreItems(itemsWithTags, preferences)

  // 5. Get top items with positive scores (actual matches)
  const topItems = scored
    .filter(item => item.score > 0)
    .slice(0, count)
    .map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      tags: item.tags,
      popularity_score: item.popularity_score,
      is_push: item.is_push,
      reason: generateReasonString(item.matchedTags),
      score: item.score,
    }))

  // 6. If fewer than 3 good matches, get popular fallback items
  const fallbackItems: RecommendedItem[] = []
  const showFallbackMessage = topItems.length < count

  if (showFallbackMessage) {
    const usedIds = new Set(topItems.map(item => item.id))
    const remainingCount = count - topItems.length

    // Get popular items as fallback (sorted by popularity_score)
    const popularFallbacks = itemsWithTags
      .filter(item => !usedIds.has(item.id))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, remainingCount)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        tags: item.tags,
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
    missingPreferences: showFallbackMessage ? {
      mood: preferences.mood,
      flavors: preferences.flavors,
      dietary: preferences.dietary,
    } : null,
  }
}

function scoreItems(
  items: Array<{
    id: string
    name: string
    description: string | null
    price: number
    category: string
    tags: MenuTag[]
    popularity_score: number
    is_push: boolean
  }>,
  preferences: GuestPreferences
): ScoredItem[] {
  const scored = items.map(item => {
    let score = 0
    const matchedTags: MenuTag[] = []

    // Mood match (required): +5 points
    if (preferences.mood && item.tags.includes(preferences.mood)) {
      score += 5
      matchedTags.push(preferences.mood)
    } else if (preferences.mood) {
      // Mood is required - items without matching mood get heavily penalized
      score -= 100
    }

    // Flavor match: +3 points per match
    preferences.flavors.forEach(flavor => {
      if (item.tags.includes(flavor)) {
        score += 3
        matchedTags.push(flavor)
      }
    })

    // Portion match (required): +4 points
    if (preferences.portion && item.tags.includes(preferences.portion)) {
      score += 4
      matchedTags.push(preferences.portion)
    } else if (preferences.portion) {
      // Portion is required - items without matching portion get heavily penalized
      score -= 100
    }

    // Dietary MUST match: filter out items that don't meet ALL dietary requirements
    if (preferences.dietary.length > 0) {
      const meetsAllDietary = preferences.dietary.every(diet =>
        item.tags.includes(diet)
      )
      if (!meetsAllDietary) {
        // Item doesn't meet dietary requirements - exclude completely
        score -= 1000
      } else {
        // Add matched dietary tags for reason string
        preferences.dietary.forEach(diet => {
          if (item.tags.includes(diet)) {
            matchedTags.push(diet)
          }
        })
      }
    }

    // Price preference (optional bonus)
    if (preferences.price && item.tags.includes(preferences.price)) {
      score += 2
      matchedTags.push(preferences.price)
    }

    // Popularity: +0.1 * popularity_score
    score += 0.1 * item.popularity_score

    // is_push: +2 points
    if (item.is_push) {
      score += 2
    }

    return {
      ...item,
      score,
      matchedTags,
    }
  })

  // Sort by score descending, filter out heavily penalized items
  return scored
    .filter(item => item.score > -50)
    .sort((a, b) => b.score - a.score)
}

function generateReasonString(matchedTags: MenuTag[]): string {
  const parts: string[] = []

  // Check mood
  const moodTag = matchedTags.find(t => t.startsWith('mood_'))
  if (moodTag) {
    const moodLabels: Record<string, string> = {
      mood_comfort: 'Comfort food',
      mood_light: 'Light & fresh',
      mood_protein: 'Protein-packed',
      mood_warm: 'Warm & cozy',
      mood_treat: 'Sweet indulgence',
    }
    parts.push(moodLabels[moodTag] || TAG_LABELS[moodTag as MenuTag])
  }

  // Check flavors
  const flavorTags = matchedTags.filter(t => t.startsWith('flavor_')) as FlavorTag[]
  flavorTags.forEach(flavor => {
    const flavorLabels: Record<string, string> = {
      flavor_umami: 'umami-rich',
      flavor_spicy: 'with a kick',
      flavor_sweet: 'sweet notes',
      flavor_tangy: 'tangy flavours',
      flavor_smoky: 'smoky depth',
    }
    parts.push(flavorLabels[flavor] || TAG_LABELS[flavor].toLowerCase())
  })

  // Check portion
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

  // Check dietary
  const dietTags = matchedTags.filter(t => t.startsWith('diet_') || t.startsWith('allergy_')) as DietTag[]
  if (dietTags.length > 0) {
    const dietLabels = dietTags.slice(0, 1).map(d => TAG_LABELS[d])
    parts.push(dietLabels.join(', '))
  }

  if (parts.length === 0) {
    return "Chef's recommendation"
  }

  // Capitalize first letter and join
  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

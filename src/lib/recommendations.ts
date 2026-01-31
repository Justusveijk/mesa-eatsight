import { createClient } from '@/lib/supabase/client'
import { GuestPreferences, MenuTag, TAG_LABELS, DietTag, FlavorTag } from './types/taxonomy'
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

  // 2. Get all available FOOD items with their tags
  // STRICT TYPE FILTER: Only get items where type='food'
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      category,
      type,
      popularity_score,
      is_push,
      is_out_of_stock,
      is_available,
      item_tags (tag)
    `)
    .eq('menu_id', menu.id)
    .eq('is_available', true)
    .eq('type', 'food')

  if (itemsError || !items) {
    console.error('Failed to fetch menu items:', itemsError?.message, itemsError?.details, itemsError?.hint, itemsError)
    return { recommendations: [], fallbackItems: [], showFallbackMessage: false, missingPreferences: null }
  }

  console.log('[Food Recs] Fetched', items.length, 'FOOD items (type=food)')

  // 3. Transform items with tags (also filter out of stock items)
  const itemsWithTags = items
    .filter(item => !item.is_out_of_stock && item.is_available !== false)
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

// Drink recommendations with strict ABV filtering
export async function getDrinkRecommendations(
  venueId: string,
  preferences: DrinkPreferences,
  count: number = 3
): Promise<RecommendedItem[]> {
  const supabase = createClient()

  console.log('========== DRINK RECOMMENDATION DEBUG ==========')
  console.log('Venue ID:', venueId)
  console.log('Preferences:', JSON.stringify(preferences, null, 2))

  // 1. Get the published menu for this venue
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .single()

  if (menuError || !menu) {
    console.error('Failed to fetch menu:', menuError?.message)
    return []
  }

  console.log('Found menu:', menu.id)

  // 2. Get all available DRINK items with their tags
  // STRICT TYPE FILTER: Only get items where type='drink'
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      category,
      type,
      popularity_score,
      is_push,
      is_out_of_stock,
      is_available,
      item_tags (tag)
    `)
    .eq('menu_id', menu.id)
    .eq('is_available', true)
    .eq('type', 'drink')

  if (itemsError || !items) {
    console.error('Failed to fetch menu items:', itemsError?.message)
    return []
  }

  console.log('Total DRINK items fetched:', items.length)

  // 3. Transform items with tags (filter out of stock)
  const drinkItems = items
    .filter(item => !item.is_out_of_stock && item.is_available !== false)
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

  console.log('Drink items (type=drink):', drinkItems.length)
  if (drinkItems.length > 0) {
    console.log('Drinks by category:')
    const byCategory: Record<string, string[]> = {}
    drinkItems.forEach(item => {
      const cat = item.category || 'Uncategorized'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(`${item.name} [tags: ${item.tags.join(', ')}]`)
    })
    console.log(JSON.stringify(byCategory, null, 2))
  }

  // 4. STRICT ABV filtering - this is mandatory
  // NEW: Support both old strength_* format and new abv_* format
  let filteredDrinks = drinkItems
  const strengthPref = preferences.drinkStrength

  console.log('Strength preference:', strengthPref)

  // Map both old and new formats
  const isNonAlcoholic = strengthPref === 'strength_none' || strengthPref === 'abv_zero'
  const isLight = strengthPref === 'strength_light' || strengthPref === 'abv_light'

  if (isNonAlcoholic) {
    console.log('Filtering for NON-ALCOHOLIC drinks...')
    // Only non-alcoholic drinks
    filteredDrinks = drinkItems.filter(drink => {
      // Cast tags to string array for comparison with non-MenuTag values
      const tagStrings = drink.tags as unknown as string[]
      const hasNonAlcoholicTag = tagStrings.some(t =>
        t === 'abv_zero' || t === 'strength_none' || t === 'non_alcoholic' || t.includes('zero')
      )
      // Include hot drinks in non-alcoholic categories
      const isNonAlcoholicCategory = ['mocktails', 'soft drinks', 'smoothies', 'coffee', 'tea', 'juice', 'hot drinks']
        .some(cat => drink.category?.toLowerCase().includes(cat))

      // Check if item has alcoholic tag - if so, exclude it
      const hasAlcoholicTag = tagStrings.some(t =>
        t === 'abv_light' || t === 'abv_regular' || t === 'abv_strong' ||
        t === 'strength_light' || t === 'strength_medium' || t === 'strength_strong'
      )

      const passes = (hasNonAlcoholicTag || isNonAlcoholicCategory) && !hasAlcoholicTag
      console.log(`  ${drink.name} [${drink.category}]: hasNonAlcTag=${hasNonAlcoholicTag}, isNonAlcCat=${isNonAlcoholicCategory}, hasAlcTag=${hasAlcoholicTag} => ${passes ? 'PASS' : 'FAIL'}`)

      return passes
    })
  } else if (isLight) {
    console.log('Filtering for LIGHT drinks...')
    // Light alcohol or non-alcoholic (beer, wine, spritz, hot drinks)
    filteredDrinks = drinkItems.filter(drink => {
      const tagStrings = drink.tags as unknown as string[]
      const hasLightTag = tagStrings.some(t =>
        t === 'abv_light' || t === 'abv_zero' || t === 'strength_none' || t === 'strength_light' || t === 'non_alcoholic'
      )
      // Include hot drinks in light category (most hot drinks are non-alcoholic or light)
      const isLightCategory = ['wines', 'wine', 'beers', 'beer', 'spritz', 'mocktails', 'soft drinks', 'cider', 'hot drinks', 'coffee', 'tea']
        .some(cat => drink.category?.toLowerCase().includes(cat))
      // Exclude strong spirits
      const isStrong = drink.category?.toLowerCase().includes('spirit') ||
                       drink.category?.toLowerCase().includes('whiskey') ||
                       drink.category?.toLowerCase().includes('whisky')

      return (hasLightTag || isLightCategory) && !isStrong
    })
  }
  // For strength_medium/abv_regular and strength_strong/abv_strong, show all drinks (including alcoholic)

  console.log(`After ABV filter: ${filteredDrinks.length} drinks remaining`)
  console.log('Filtered drinks:', filteredDrinks.map(d => `${d.name} [${d.category}]`))

  // 5. Score drinks based on preferences
  const scored = filteredDrinks.map(drink => {
    let score = 0
    const matchedTags: MenuTag[] = []
    const category = (drink.category || '').toLowerCase()

    console.log(`\nScoring: ${drink.name}`)
    console.log(`  Category: ${category}`)
    console.log(`  Tags: ${drink.tags.join(', ')}`)

    // NEW: drinkFeel scoring (temperature/format) - this replaces drinkMood
    if (preferences.drinkFeel) {
      console.log(`  Feel preference: ${preferences.drinkFeel}`)

      if (preferences.drinkFeel === 'temp_hot') {
        // User wants warming drinks
        if (drink.tags.includes('temp_hot' as MenuTag)) {
          score += 25
          matchedTags.push('temp_hot' as MenuTag)
          console.log(`  +25 for temp_hot tag`)
        }
        // Strong boost for Hot Drinks category
        if (category === 'hot drinks' || category.includes('coffee') || category.includes('tea')) {
          score += 20
          console.log(`  +20 for hot drinks category`)
        }
      } else if (preferences.drinkFeel === 'format_crisp') {
        if (drink.tags.includes('format_crisp' as MenuTag) || drink.tags.includes('temp_chilled' as MenuTag)) {
          score += 20
          matchedTags.push('format_crisp' as MenuTag)
          console.log(`  +20 for crisp/cold`)
        }
      } else if (preferences.drinkFeel === 'format_sparkling') {
        if (drink.tags.includes('format_sparkling' as MenuTag)) {
          score += 20
          matchedTags.push('format_sparkling' as MenuTag)
          console.log(`  +20 for sparkling`)
        }
      } else if (preferences.drinkFeel === 'format_creamy') {
        if (drink.tags.includes('format_creamy' as MenuTag)) {
          score += 20
          matchedTags.push('format_creamy' as MenuTag)
          console.log(`  +20 for creamy`)
        }
      }
    }

    // Legacy: drinkMood scoring (for backward compatibility)
    if (preferences.drinkMood && !preferences.drinkFeel) {
      const moodTagMap: Record<string, string[]> = {
        'drink_refreshing': ['format_crisp', 'format_refreshing', 'flavor_tangy', 'temp_chilled'],
        'drink_warming': ['format_warming', 'temp_hot', 'flavor_smoky', 'mood_comfort'],
        'drink_celebratory': ['format_sparkling', 'format_celebratory'],
        'drink_relaxing': ['format_smooth', 'mood_comfort', 'format_creamy'],
        'drink_energizing': ['format_bold', 'temp_hot'],
      }
      const targetTags = moodTagMap[preferences.drinkMood] || []
      targetTags.forEach(tag => {
        if (drink.tags.includes(tag as MenuTag)) {
          const boost = (preferences.drinkMood === 'drink_warming' && tag === 'temp_hot') ? 15 : 3
          score += boost
          matchedTags.push(tag as MenuTag)
        }
      })

      if (preferences.drinkMood === 'drink_warming') {
        const isHotDrinksCategory = category === 'hot drinks'
        if (isHotDrinksCategory) {
          score += 20
          matchedTags.push('temp_hot' as MenuTag)
        } else if (category.includes('hot') || category.includes('coffee')) {
          score += 10
        }
      }
    }

    // NEW: drinkTaste scoring (flavor preferences) - multi-select
    if (preferences.drinkTaste && preferences.drinkTaste.length > 0) {
      preferences.drinkTaste.forEach(taste => {
        if (drink.tags.includes(taste as MenuTag)) {
          score += 10
          matchedTags.push(taste as MenuTag)
          console.log(`  +10 for taste match: ${taste}`)
        }
      })
    }

    // Legacy: drinkStyle scoring (for backward compatibility)
    if (preferences.drinkStyle && (!preferences.drinkTaste || preferences.drinkTaste.length === 0)) {
      const styleTagMap: Record<string, string[]> = {
        'style_classic': ['format_classic'],
        'style_adventurous': ['format_signature', 'format_adventurous'],
        'style_sweet': ['flavor_sweet', 'format_fruity'],
        'style_dry': ['flavor_dry', 'format_crisp'],
        'style_bitter': ['flavor_bitter', 'format_bold'],
      }
      const targetTags = styleTagMap[preferences.drinkStyle] || []
      targetTags.forEach(tag => {
        if (drink.tags.includes(tag as MenuTag)) {
          score += 3
          matchedTags.push(tag as MenuTag)
        }
      })
    }

    // ABV match bonus (map strength preferences to abv tags)
    const strengthToAbv: Record<string, string> = {
      'strength_none': 'abv_zero',
      'strength_light': 'abv_light',
      'strength_medium': 'abv_regular',
      'strength_strong': 'abv_strong',
      'abv_zero': 'abv_zero',
      'abv_light': 'abv_light',
      'abv_regular': 'abv_regular',
      'abv_strong': 'abv_strong',
    }
    if (preferences.drinkStrength) {
      const abvTag = strengthToAbv[preferences.drinkStrength]
      const drinkTagStrings = drink.tags as unknown as string[]
      if (abvTag && drinkTagStrings.includes(abvTag)) {
        score += 2
        matchedTags.push(abvTag as MenuTag)
        console.log(`  +2 for ABV match: ${abvTag}`)
      }
    }

    // Popularity bonus
    score += 0.1 * drink.popularity_score

    // Push items bonus
    if (drink.is_push) {
      score += 2
    }

    console.log(`  Final score: ${score}`)

    return {
      ...drink,
      score,
      matchedTags,
    }
  })

  // 6. Sort by score and return top items
  const sorted = scored.sort((a, b) => b.score - a.score)

  console.log('\n========== TOP RESULTS ==========')
  sorted.slice(0, count).forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} - score: ${d.score}`)
  })

  // Get recommendations with reasons
  return sorted.slice(0, count).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    tags: item.tags,
    popularity_score: item.popularity_score,
    is_push: item.is_push,
    reason: generateDrinkReason(item.matchedTags, preferences),
    score: item.score,
  }))
}

function generateDrinkReason(matchedTags: MenuTag[], preferences: DrinkPreferences): string {
  const parts: string[] = []

  // NEW: Check feel (temperature/format)
  if (preferences.drinkFeel === 'temp_hot' && matchedTags.some(t => t.includes('hot'))) {
    parts.push('Warming')
  } else if (preferences.drinkFeel === 'format_crisp' && matchedTags.some(t => t.includes('crisp') || t.includes('chilled'))) {
    parts.push('Refreshing')
  } else if (preferences.drinkFeel === 'format_sparkling' && matchedTags.some(t => t.includes('sparkling'))) {
    parts.push('Bubbly')
  } else if (preferences.drinkFeel === 'format_creamy' && matchedTags.some(t => t.includes('creamy'))) {
    parts.push('Smooth & creamy')
  }

  // Legacy: Check mood (for backward compatibility)
  if (!preferences.drinkFeel && preferences.drinkMood) {
    if (preferences.drinkMood === 'drink_refreshing' && matchedTags.some(t => t.includes('crisp') || t.includes('refreshing') || t.includes('chilled'))) {
      parts.push('Refreshing')
    } else if (preferences.drinkMood === 'drink_warming' && matchedTags.some(t => t.includes('warming') || t.includes('hot'))) {
      parts.push('Warming')
    } else if (preferences.drinkMood === 'drink_celebratory' && matchedTags.some(t => t.includes('sparkling'))) {
      parts.push('Celebratory')
    } else if (preferences.drinkMood === 'drink_relaxing') {
      parts.push('Easy-going')
    } else if (preferences.drinkMood === 'drink_energizing') {
      parts.push('Energizing')
    }
  }

  // NEW: Check taste preferences
  if (preferences.drinkTaste && preferences.drinkTaste.length > 0) {
    if (preferences.drinkTaste.includes('flavor_sweet') && matchedTags.some(t => t.includes('sweet'))) {
      parts.push('sweet notes')
    }
    if (preferences.drinkTaste.includes('flavor_tangy') && matchedTags.some(t => t.includes('tangy'))) {
      parts.push('citrus kick')
    }
    if (preferences.drinkTaste.includes('flavor_bitter') && matchedTags.some(t => t.includes('bitter'))) {
      parts.push('bitter complexity')
    }
    if (preferences.drinkTaste.includes('flavor_spicy') && matchedTags.some(t => t.includes('spicy'))) {
      parts.push('spicy warmth')
    }
    if (preferences.drinkTaste.includes('flavor_smoky') && matchedTags.some(t => t.includes('smoky'))) {
      parts.push('smoky depth')
    }
  }

  // Legacy: Check style (for backward compatibility)
  if ((!preferences.drinkTaste || preferences.drinkTaste.length === 0) && preferences.drinkStyle) {
    if (preferences.drinkStyle === 'style_sweet' && matchedTags.some(t => t.includes('sweet'))) {
      parts.push('sweet notes')
    } else if (preferences.drinkStyle === 'style_dry' && matchedTags.some(t => t.includes('dry') || t.includes('crisp'))) {
      parts.push('dry & crisp')
    } else if (preferences.drinkStyle === 'style_bitter' && matchedTags.some(t => t.includes('bitter'))) {
      parts.push('bitter complexity')
    } else if (preferences.drinkStyle === 'style_classic') {
      parts.push('timeless classic')
    } else if (preferences.drinkStyle === 'style_adventurous') {
      parts.push('something different')
    }
  }

  // ABV - support both old and new format
  const isNonAlcoholic = preferences.drinkStrength === 'strength_none' || preferences.drinkStrength === 'abv_zero'
  const isLight = preferences.drinkStrength === 'strength_light' || preferences.drinkStrength === 'abv_light'

  if (isNonAlcoholic) {
    parts.push('alcohol-free')
  } else if (isLight) {
    parts.push('light & easy')
  }

  if (parts.length === 0) {
    return 'Popular choice'
  }

  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
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

    // DIETARY REQUIREMENTS ARE MANDATORY
    // If user has dietary needs, items MUST have those tags or be excluded
    if (preferences.dietary.length > 0) {
      const meetsAllDietary = preferences.dietary.every(diet => {
        // Special handling: vegetarian also accepts vegan items
        if (diet === 'diet_vegetarian') {
          return item.tags.includes('diet_vegetarian') || item.tags.includes('diet_vegan')
        }
        return item.tags.includes(diet)
      })

      if (!meetsAllDietary) {
        // Item doesn't meet dietary requirements - exclude completely
        return {
          ...item,
          score: -1000,
          matchedTags: [],
        }
      }

      // Add matched dietary tags for reason string
      preferences.dietary.forEach(diet => {
        if (item.tags.includes(diet)) {
          matchedTags.push(diet)
        }
      })
      // Bonus for matching dietary
      score += 3
    }

    // Mood match (preferred but not required): +5 points
    if (preferences.mood && item.tags.includes(preferences.mood)) {
      score += 5
      matchedTags.push(preferences.mood)
    }

    // Flavor match: +3 points per match
    preferences.flavors.forEach(flavor => {
      if (item.tags.includes(flavor)) {
        score += 3
        matchedTags.push(flavor)
      }
    })

    // Portion match (preferred but not required): +4 points
    if (preferences.portion && item.tags.includes(preferences.portion)) {
      score += 4
      matchedTags.push(preferences.portion)
    }

    // Price preference (optional bonus)
    if (preferences.price && item.tags.includes(preferences.price)) {
      score += 2
      matchedTags.push(preferences.price)
    }

    // Popularity: +0.1 * popularity_score
    score += 0.1 * item.popularity_score

    // is_push: +2 points (featured items)
    if (item.is_push) {
      score += 2
    }

    return {
      ...item,
      score,
      matchedTags,
    }
  })

  // Sort by score descending, filter out items that failed dietary requirements
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

import { createClient } from '@/lib/supabase/client'

interface DrinkUpsell {
  id: string
  name: string
  price: number
  reason: string
}

export async function getUpsellDrink(
  venueId: string,
  foodMood: string | undefined
): Promise<DrinkUpsell | null> {
  const supabase = createClient()

  // Get published menu
  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .single()

  if (!menu) return null

  // Get available drinks with tags
  const { data: drinks } = await supabase
    .from('menu_items')
    .select('*, item_tags(tag)')
    .eq('menu_id', menu.id)
    .eq('type', 'drink')
    .eq('is_available', true)
    .neq('is_out_of_stock', true)

  if (!drinks || drinks.length === 0) return null

  // Score drinks based on food mood pairing
  const scored = drinks.map(drink => {
    const tags = (drink.item_tags as { tag: string }[])?.map(t => t.tag) || []
    let score = (drink.popularity_score || 0) * 0.1

    if (foodMood === 'mood_comfort') {
      if (tags.some(t => t.includes('unwind'))) score += 10
      if (tags.includes('drink_flavor_dry')) score += 5
    }
    if (foodMood === 'mood_light') {
      if (tags.some(t => t.includes('refresh'))) score += 10
      if (tags.includes('drink_flavor_fruity')) score += 5
    }
    if (foodMood === 'mood_treat') {
      if (tags.some(t => t.includes('treat') || t.includes('celebrate'))) score += 10
      if (tags.includes('drink_flavor_sweet')) score += 5
    }
    if (foodMood === 'mood_warm') {
      if (tags.some(t => t.includes('unwind'))) score += 8
    }
    if (foodMood === 'mood_protein') {
      if (tags.some(t => t.includes('energize'))) score += 8
    }

    if (drink.is_push) score += 5

    return { ...drink, score, tags }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored[0]
  if (!top) return null

  // Generate pairing reason
  let reason = 'Pairs perfectly'
  if (foodMood === 'mood_comfort') reason = 'Perfect with comfort food'
  if (foodMood === 'mood_light') reason = 'Light & refreshing match'
  if (foodMood === 'mood_treat') reason = 'Indulgent pairing'
  if (foodMood === 'mood_warm') reason = 'Cozy companion'
  if (foodMood === 'mood_protein') reason = 'Great with protein'

  return {
    id: top.id,
    name: top.name,
    price: top.price || 0,
    reason,
  }
}

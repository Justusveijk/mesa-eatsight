import { MenuItem, GuestPreferences, MenuTag, TAG_LABELS, DietTag, FlavorTag } from './types/taxonomy'

interface ScoredItem extends MenuItem {
  score: number
  matchedTags: MenuTag[]
}

export function scoreAndRankItems(
  items: MenuItem[],
  preferences: GuestPreferences
): ScoredItem[] {
  const scored = items
    .filter(item => !item.isOutOfStock)
    .map(item => {
      let score = 0
      const matchedTags: MenuTag[] = []

      // Mood match (required, high weight)
      if (preferences.mood && item.tags.includes(preferences.mood)) {
        score += 5
        matchedTags.push(preferences.mood)
      } else if (preferences.mood) {
        // Mood is required - if no match, significantly reduce score
        score -= 3
      }

      // Flavor matches (bonus)
      preferences.flavors.forEach(flavor => {
        if (item.tags.includes(flavor)) {
          score += 3
          matchedTags.push(flavor)
        }
      })

      // Portion match (required, high weight)
      if (preferences.portion && item.tags.includes(preferences.portion)) {
        score += 4
        matchedTags.push(preferences.portion)
      } else if (preferences.portion) {
        score -= 2
      }

      // Dietary constraints (EXCLUSIONARY - must respect)
      if (preferences.dietary.length > 0) {
        const meetsAllDietary = preferences.dietary.every(diet =>
          item.tags.includes(diet)
        )
        if (meetsAllDietary) {
          score += 10
          preferences.dietary.forEach(diet => {
            if (item.tags.includes(diet)) {
              matchedTags.push(diet)
            }
          })
        } else {
          // Item doesn't meet dietary requirements - exclude
          score -= 1000
        }
      }

      // Price preference (optional bonus)
      if (preferences.price && item.tags.includes(preferences.price)) {
        score += 2
        matchedTags.push(preferences.price)
      }

      // Popularity boost (slight)
      if (item.popularity) {
        score += item.popularity / 100
      }

      // Operator push bonus
      if (item.isPush) {
        score += 2
      }

      return {
        ...item,
        score,
        matchedTags,
      }
    })

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score)
}

export function generateReasonString(matchedTags: MenuTag[]): string {
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
    parts.push(moodLabels[moodTag] || TAG_LABELS[moodTag])
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
    return 'Chef\'s recommendation'
  }

  // Capitalize first letter and join
  const result = parts.join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export function getTopRecommendations(
  items: MenuItem[],
  preferences: GuestPreferences,
  count: number = 3
): Array<MenuItem & { reason: string }> {
  const scored = scoreAndRankItems(items, preferences)

  return scored
    .slice(0, count)
    .map(item => ({
      ...item,
      reason: generateReasonString(item.matchedTags),
    }))
}

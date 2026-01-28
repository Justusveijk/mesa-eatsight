import { MenuTag } from '@/lib/types/taxonomy'

export interface DetailedCSVRow {
  name: string
  description?: string
  category: string
  subcategory?: string
  price: string | number
  currency?: string
  tags?: string
  allergens?: string
  dietary?: string
  abv_percent?: string | number
  sweetness_0_5?: string | number
  bitterness_0_5?: string | number
  sourness_0_5?: string | number
  spice_0_3?: string | number
  intensity_0_5?: string | number
  base?: string
  volume_ml?: string | number
  availability?: string
}

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === '') return 0
  const num = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(num) ? 0 : num
}

function containsAny(text: string | undefined, ...keywords: string[]): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

export function generateTagsFromCSVRow(row: DetailedCSVRow): MenuTag[] {
  const tags: MenuTag[] = []

  const category = row.category?.toLowerCase() || ''
  const subcategory = row.subcategory?.toLowerCase() || ''
  const description = row.description?.toLowerCase() || ''
  const dietary = row.dietary?.toLowerCase() || ''
  const allergens = row.allergens?.toLowerCase() || ''

  const sweetness = parseNumber(row.sweetness_0_5)
  const bitterness = parseNumber(row.bitterness_0_5)
  const sourness = parseNumber(row.sourness_0_5)
  const spice = parseNumber(row.spice_0_3)
  const intensity = parseNumber(row.intensity_0_5)
  const volumeMl = parseNumber(row.volume_ml)

  // Determine if this is a drink or food item
  const isDrink = containsAny(category, 'drink', 'beer', 'wine', 'cocktail', 'spirit', 'beverage', 'coffee', 'tea', 'juice', 'soda')

  // ============ MOOD (pick 1) ============
  let moodTag: MenuTag | null = null

  if (containsAny(category, 'sweet', 'dessert') || sweetness >= 4) {
    moodTag = 'mood_treat'
  } else if (containsAny(category, 'cocktail') && intensity >= 4) {
    moodTag = 'mood_comfort'
  } else if (containsAny(category, 'salad', 'light')) {
    moodTag = 'mood_light'
  } else if (intensity >= 4 && containsAny(category, 'burger', 'steak', 'meat', 'grill')) {
    moodTag = 'mood_protein'
  } else if (containsAny(category, 'soup') || containsAny(description, 'warm', 'hot')) {
    moodTag = 'mood_warm'
  } else {
    // Default
    moodTag = 'mood_comfort'
  }

  if (moodTag) tags.push(moodTag)

  // ============ FLAVOR (pick 1-2) ============
  const flavorTags: MenuTag[] = []

  if (sweetness >= 3) {
    flavorTags.push('flavor_sweet')
  }
  if (bitterness >= 3 || sourness >= 3) {
    flavorTags.push('flavor_tangy')
  }
  if (spice >= 2) {
    flavorTags.push('flavor_spicy')
  }
  if (containsAny(description, 'smoke', 'smoked', 'mezcal', 'bbq', 'barbecue', 'charred')) {
    flavorTags.push('flavor_smoky')
  }
  if (containsAny(description, 'umami', 'miso', 'parmesan', 'soy', 'mushroom', 'truffle')) {
    flavorTags.push('flavor_umami')
  }

  // Add up to 2 flavor tags
  tags.push(...flavorTags.slice(0, 2))

  // ============ PORTION (pick 1) ============
  let portionTag: MenuTag = 'portion_standard'

  if (containsAny(category, 'sharing', 'board', 'platter', 'feast')) {
    portionTag = 'portion_hearty'
  } else if (containsAny(category, 'bite', 'snack', 'tapas', 'small') || (volumeMl > 0 && volumeMl <= 100)) {
    portionTag = 'portion_bite'
  }

  tags.push(portionTag)

  // ============ TEMPERATURE (pick 1) ============
  let tempTag: MenuTag = 'temp_room'

  if (containsAny(category, 'beer', 'wine') || containsAny(subcategory, 'cocktail') || isDrink) {
    tempTag = 'temp_chilled'
  } else if (containsAny(category, 'soup') || containsAny(description, 'warm', 'hot', 'steaming')) {
    tempTag = 'temp_hot'
  }

  tags.push(tempTag)

  // ============ DIETARY (pick all that apply) ============
  if (containsAny(dietary, 'vegetarian')) {
    tags.push('diet_vegetarian')
  }
  if (containsAny(dietary, 'vegan')) {
    tags.push('diet_vegan')
  }

  // Gluten-free: no gluten allergen and doesn't contain bread/pasta keywords
  const hasGluten = containsAny(allergens, 'gluten', 'wheat')
  const hasBreadPasta = containsAny(description, 'bread', 'pasta', 'noodle', 'flour', 'pizza', 'wrap', 'bun')
  if (!hasGluten && !hasBreadPasta) {
    tags.push('diet_gluten_free')
  }

  // Dairy-free
  if (!containsAny(allergens, 'milk', 'dairy', 'lactose', 'cheese', 'cream')) {
    tags.push('diet_dairy_free')
  }

  // Halal
  if (containsAny(dietary, 'halal')) {
    tags.push('diet_halal')
  }

  // Nut-free (only if allergens doesn't contain nuts)
  if (!containsAny(allergens, 'nut', 'almond', 'cashew', 'peanut', 'walnut', 'pistachio', 'hazelnut')) {
    tags.push('allergy_nut_free')
  }

  // ============ PROTEIN (pick 0-1) ============
  if (containsAny(description, 'chicken', 'poultry', 'duck', 'turkey')) {
    tags.push('protein_poultry')
  } else if (containsAny(description, 'beef', 'pork', 'meat', 'steak', 'lamb', 'bacon', 'ham')) {
    tags.push('protein_red_meat')
  } else if (containsAny(description, 'fish', 'salmon', 'tuna', 'seafood', 'shrimp', 'prawn', 'crab', 'lobster', 'cod', 'bass')) {
    tags.push('protein_seafood')
  } else if (containsAny(dietary, 'vegetarian', 'vegan') || containsAny(description, 'tofu', 'tempeh', 'seitan', 'plant')) {
    tags.push('protein_plant')
  }

  // ============ PREP (pick 0-1) ============
  if (containsAny(description, 'grilled', 'grill', 'chargrilled')) {
    tags.push('prep_grilled')
  } else if (containsAny(description, 'fried', 'crispy', 'crunchy', 'deep-fried', 'tempura')) {
    tags.push('prep_fried_crispy')
  } else if (containsAny(description, 'raw', 'fresh', 'tartare', 'ceviche', 'carpaccio', 'sashimi')) {
    tags.push('prep_raw_fresh')
  }

  return tags
}

// Check if a row has the required tags for a complete item
export function getTagValidation(tags: MenuTag[]): { isValid: boolean; missing: string[] } {
  const missing: string[] = []

  // Check for mood tag
  const hasMood = tags.some(t => t.startsWith('mood_'))
  if (!hasMood) missing.push('mood')

  // Check for portion tag
  const hasPortion = tags.some(t => t.startsWith('portion_'))
  if (!hasPortion) missing.push('portion')

  // Check for temperature tag
  const hasTemp = tags.some(t => t.startsWith('temp_'))
  if (!hasTemp) missing.push('temperature')

  return {
    isValid: missing.length === 0,
    missing,
  }
}

// Check if CSV has detailed format columns
export function isDetailedFormat(headers: string[]): boolean {
  const detailedColumns = ['sweetness_0_5', 'bitterness_0_5', 'intensity_0_5', 'dietary', 'allergens']
  return detailedColumns.some(col => headers.includes(col))
}

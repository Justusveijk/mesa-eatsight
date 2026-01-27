// The 30-Tag Base Taxonomy

// 1. Mood / Goal (5) - exactly 1 per item
export type MoodTag =
  | 'mood_comfort'   // burgers, mac & cheese, rich sauces
  | 'mood_light'     // salads, poke, veggie mains
  | 'mood_protein'   // steak, chicken bowls, high-protein plates
  | 'mood_warm'      // soups, ramen, hot plates
  | 'mood_treat'     // desserts, decadent cocktails

// 2. Flavor Direction (5) - 1-2 per item
export type FlavorTag =
  | 'flavor_umami'   // miso, parmesan, soy, mushrooms
  | 'flavor_spicy'   // chili, hot sauce, pepper-forward
  | 'flavor_sweet'   // dessert, sweet glazes, sweet cocktails
  | 'flavor_tangy'   // citrus, vinegar, pickled, sour
  | 'flavor_smoky'   // BBQ, smoked, mezcal notes

// 3. Hunger / Satiety (3) - exactly 1 per item
export type PortionTag =
  | 'portion_bite'      // snacks, sides, small plates
  | 'portion_standard'  // regular mains
  | 'portion_hearty'    // large mains, loaded bowls, sharing platters

// 4. Dietary Needs (7) - 0-2 per item
export type DietTag =
  | 'diet_vegetarian'
  | 'diet_vegan'
  | 'diet_gluten_free'
  | 'diet_dairy_free'
  | 'diet_halal'
  | 'diet_no_pork'
  | 'allergy_nut_free'

// 5. Temperature (3) - exactly 1 per item
export type TempTag =
  | 'temp_hot'
  | 'temp_chilled'
  | 'temp_room'

// 6. Protein Type (4) - 0-1 per item
export type ProteinTag =
  | 'protein_poultry'
  | 'protein_red_meat'
  | 'protein_seafood'
  | 'protein_plant'

// 7. Preparation / Format (3) - 0-1 per item
export type PrepTag =
  | 'prep_grilled'
  | 'prep_fried_crispy'
  | 'prep_raw_fresh'

// Auto-tags (system-generated)
export type PriceTag = 'price_1' | 'price_2' | 'price_3'

// Combined tag type
export type MenuTag =
  | MoodTag
  | FlavorTag
  | PortionTag
  | DietTag
  | TempTag
  | ProteinTag
  | PrepTag
  | PriceTag

// Menu item interface
export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  tags: MenuTag[]
  popularity?: number
  isPush?: boolean
  isOutOfStock?: boolean
}

// Guest preferences from questionnaire
export interface GuestPreferences {
  mood: MoodTag | null
  flavors: FlavorTag[]
  portion: PortionTag | null
  dietary: DietTag[]
  price: PriceTag | null
}

// Tag metadata for display
export const TAG_LABELS: Record<MenuTag, string> = {
  // Mood
  mood_comfort: 'Comfort / Indulgent',
  mood_light: 'Fresh / Light',
  mood_protein: 'High-protein',
  mood_warm: 'Warm / Cozy',
  mood_treat: 'Sweet Treat',
  // Flavor
  flavor_umami: 'Savoury / Umami',
  flavor_spicy: 'Spicy',
  flavor_sweet: 'Sweet',
  flavor_tangy: 'Tangy / Sour',
  flavor_smoky: 'Smoky',
  // Portion
  portion_bite: 'Just a bite',
  portion_standard: 'Regular',
  portion_hearty: 'Hearty',
  // Dietary
  diet_vegetarian: 'Vegetarian',
  diet_vegan: 'Vegan',
  diet_gluten_free: 'Gluten-free',
  diet_dairy_free: 'Dairy-free',
  diet_halal: 'Halal',
  diet_no_pork: 'No pork',
  allergy_nut_free: 'Nut-free',
  // Temperature
  temp_hot: 'Hot',
  temp_chilled: 'Chilled',
  temp_room: 'Room temp',
  // Protein
  protein_poultry: 'Poultry',
  protein_red_meat: 'Red meat',
  protein_seafood: 'Seafood',
  protein_plant: 'Plant-based',
  // Prep
  prep_grilled: 'Grilled',
  prep_fried_crispy: 'Fried / Crispy',
  prep_raw_fresh: 'Raw / Fresh',
  // Price
  price_1: '€ Value',
  price_2: '€€ Mid-range',
  price_3: '€€€ Premium',
}

// Tag categories for the editor
export const TAG_CATEGORIES = {
  mood: {
    label: 'Mood',
    required: true,
    max: 1,
    tags: ['mood_comfort', 'mood_light', 'mood_protein', 'mood_warm', 'mood_treat'] as MoodTag[],
  },
  flavor: {
    label: 'Flavor',
    required: false,
    max: 2,
    tags: ['flavor_umami', 'flavor_spicy', 'flavor_sweet', 'flavor_tangy', 'flavor_smoky'] as FlavorTag[],
  },
  portion: {
    label: 'Portion',
    required: true,
    max: 1,
    tags: ['portion_bite', 'portion_standard', 'portion_hearty'] as PortionTag[],
  },
  dietary: {
    label: 'Dietary',
    required: false,
    max: 2,
    tags: ['diet_vegetarian', 'diet_vegan', 'diet_gluten_free', 'diet_dairy_free', 'diet_halal', 'diet_no_pork', 'allergy_nut_free'] as DietTag[],
  },
  temperature: {
    label: 'Temperature',
    required: true,
    max: 1,
    tags: ['temp_hot', 'temp_chilled', 'temp_room'] as TempTag[],
  },
  protein: {
    label: 'Protein',
    required: false,
    max: 1,
    tags: ['protein_poultry', 'protein_red_meat', 'protein_seafood', 'protein_plant'] as ProteinTag[],
  },
  prep: {
    label: 'Preparation',
    required: false,
    max: 1,
    tags: ['prep_grilled', 'prep_fried_crispy', 'prep_raw_fresh'] as PrepTag[],
  },
} as const

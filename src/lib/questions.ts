// Question definitions for guest flow
// Separate questions for food vs drinks

import { MoodTag, FlavorTag, PortionTag, DietTag, PriceTag } from '@/lib/types/taxonomy'

export type DrinkMood = 'drink_refreshing' | 'drink_warming' | 'drink_celebratory' | 'drink_relaxing' | 'drink_energizing'
export type DrinkStyle = 'style_classic' | 'style_adventurous' | 'style_sweet' | 'style_dry' | 'style_bitter'
export type DrinkStrength = 'strength_light' | 'strength_medium' | 'strength_strong' | 'strength_none'

// Icon name type for mapping to Lucide icons
export type IconName =
  | 'beef' | 'salad' | 'dumbbell' | 'soup' | 'cake-slice'
  | 'cheese' | 'flame' | 'honey' | 'citrus' | 'campfire'
  | 'utensils-crossed' | 'soup' | 'drumstick'
  | 'heart' | 'star' | 'sparkles'
  | 'bubbles' | 'leaf' | 'wine' | 'flame'
  | 'coffee' | 'snowflake' | 'glass-water' | 'milk'
  | 'candy' | 'olive' | 'wood'
  | 'party-popper' | 'moon' | 'zap'
  | 'dice-5' | 'beer'

// Food questions (existing)
export const foodMoodOptions: { id: MoodTag; label: string; icon: IconName }[] = [
  { id: 'mood_comfort', label: 'Comfort / Indulgent', icon: 'beef' },
  { id: 'mood_light', label: 'Fresh / Light', icon: 'salad' },
  { id: 'mood_protein', label: 'High-protein / Filling', icon: 'dumbbell' },
  { id: 'mood_warm', label: 'Warm / Cozy', icon: 'soup' },
  { id: 'mood_treat', label: 'Sweet Treat', icon: 'cake-slice' },
]

export const foodFlavorOptions: { id: FlavorTag; label: string; icon: IconName }[] = [
  { id: 'flavor_umami', label: 'Savoury / Umami', icon: 'cheese' },
  { id: 'flavor_spicy', label: 'Spicy', icon: 'flame' },
  { id: 'flavor_sweet', label: 'Sweet', icon: 'honey' },
  { id: 'flavor_tangy', label: 'Tangy / Sour', icon: 'citrus' },
  { id: 'flavor_smoky', label: 'Smoky', icon: 'campfire' },
]

export const foodPortionOptions: { id: PortionTag; label: string; icon: IconName }[] = [
  { id: 'portion_bite', label: 'Just a bite', icon: 'utensils-crossed' },
  { id: 'portion_standard', label: 'Normal hungry', icon: 'soup' },
  { id: 'portion_hearty', label: 'Very hungry', icon: 'drumstick' },
]

export const foodDietOptions: { id: DietTag; label: string }[] = [
  { id: 'diet_vegetarian', label: 'Vegetarian' },
  { id: 'diet_vegan', label: 'Vegan' },
  { id: 'diet_gluten_free', label: 'Gluten-free' },
  { id: 'diet_dairy_free', label: 'Dairy-free' },
  { id: 'diet_halal', label: 'Halal' },
  { id: 'diet_no_pork', label: 'No pork' },
  { id: 'allergy_nut_free', label: 'Nut allergy' },
]

export const foodPriceOptions: { id: PriceTag; label: string; icon: IconName }[] = [
  { id: 'price_1', label: '€ Best value', icon: 'heart' },
  { id: 'price_2', label: '€€ Mid-range', icon: 'star' },
  { id: 'price_3', label: '€€€ Treat yourself', icon: 'sparkles' },
]

// NEW Drink question structure - simplified and reordered
// Question 1: Alcohol strength (FIRST - most important filter)
export type DrinkStrengthValue = 'abv_zero' | 'abv_light' | 'abv_regular' | 'abv_strong'
export const drinkStrengthOptions: { id: DrinkStrengthValue; label: string; icon: IconName }[] = [
  { id: 'abv_zero', label: 'No alcohol', icon: 'bubbles' },
  { id: 'abv_light', label: 'Light', icon: 'leaf' },
  { id: 'abv_regular', label: 'Regular', icon: 'wine' },
  { id: 'abv_strong', label: 'Strong', icon: 'flame' },
]

// Question 2: Temperature/Feel (SECOND - narrows down further)
export type DrinkFeelValue = 'temp_hot' | 'format_crisp' | 'format_sparkling' | 'format_creamy'
export const drinkFeelOptions: { id: DrinkFeelValue; label: string; icon: IconName }[] = [
  { id: 'temp_hot', label: 'Warming', icon: 'coffee' },
  { id: 'format_crisp', label: 'Refreshing / Cold', icon: 'snowflake' },
  { id: 'format_sparkling', label: 'Bubbly / Sparkling', icon: 'sparkles' },
  { id: 'format_creamy', label: 'Smooth / Creamy', icon: 'milk' },
]

// Question 3: Taste (LAST - fine-tunes the selection)
export type DrinkTasteValue = 'flavor_sweet' | 'flavor_tangy' | 'flavor_bitter' | 'flavor_spicy' | 'flavor_smoky'
export const drinkTasteOptions: { id: DrinkTasteValue; label: string; icon: IconName }[] = [
  { id: 'flavor_sweet', label: 'Sweet', icon: 'honey' },
  { id: 'flavor_tangy', label: 'Tangy / Citrus', icon: 'citrus' },
  { id: 'flavor_bitter', label: 'Bitter', icon: 'olive' },
  { id: 'flavor_spicy', label: 'Spicy', icon: 'flame' },
  { id: 'flavor_smoky', label: 'Smoky', icon: 'campfire' },
]

// Legacy options (keep for backward compatibility during transition)
export const drinkMoodOptions: { id: DrinkMood; label: string; icon: IconName }[] = [
  { id: 'drink_refreshing', label: 'Something refreshing', icon: 'snowflake' },
  { id: 'drink_warming', label: 'Something warming', icon: 'coffee' },
  { id: 'drink_celebratory', label: 'Celebrating!', icon: 'party-popper' },
  { id: 'drink_relaxing', label: 'Wind down', icon: 'moon' },
  { id: 'drink_energizing', label: 'Pick me up', icon: 'zap' },
]

export const drinkStyleOptions: { id: DrinkStyle; label: string; icon: IconName }[] = [
  { id: 'style_classic', label: 'Classic / Familiar', icon: 'wine' },
  { id: 'style_adventurous', label: 'Surprise me', icon: 'dice-5' },
  { id: 'style_sweet', label: 'Sweet', icon: 'candy' },
  { id: 'style_dry', label: 'Dry / Crisp', icon: 'wine' },
  { id: 'style_bitter', label: 'Bitter / Complex', icon: 'beer' },
]

// Question flow definitions
export interface FoodQuestion {
  id: 'mood' | 'flavor' | 'portion' | 'dietary' | 'price'
  title: string
  subtitle: string
  required: boolean
  multiSelect: boolean
  maxSelections?: number
}

export interface DrinkQuestion {
  id: 'drinkMood' | 'drinkStyle' | 'drinkStrength'
  title: string
  subtitle: string
  required: boolean
  multiSelect: boolean
  maxSelections?: number
}

export const foodQuestions: FoodQuestion[] = [
  {
    id: 'mood',
    title: 'What are you in the mood for?',
    subtitle: 'Select one option',
    required: true,
    multiSelect: false,
  },
  {
    id: 'flavor',
    title: 'Pick your flavour direction',
    subtitle: 'Select up to 2 (optional)',
    required: false,
    multiSelect: true,
    maxSelections: 2,
  },
  {
    id: 'portion',
    title: 'How hungry are you?',
    subtitle: 'Select one option',
    required: true,
    multiSelect: false,
  },
  {
    id: 'dietary',
    title: 'Any dietary needs?',
    subtitle: 'Select all that apply (optional)',
    required: false,
    multiSelect: true,
  },
  {
    id: 'price',
    title: 'Budget?',
    subtitle: 'Optional - skip if no preference',
    required: false,
    multiSelect: false,
  },
]

// NEW: Reordered drink questions - alcohol first!
export const drinkQuestions: DrinkQuestion[] = [
  {
    id: 'drinkStrength', // FIRST: Alcohol strength (most important filter)
    title: 'How strong do you want it?',
    subtitle: 'Select one',
    required: true,
    multiSelect: false,
  },
  {
    id: 'drinkMood', // SECOND: Temperature/Feel (maps to feel)
    title: 'What kind of drink?',
    subtitle: 'Select one',
    required: true,
    multiSelect: false,
  },
  {
    id: 'drinkStyle', // THIRD: Taste (multi-select up to 2)
    title: 'Pick your taste direction',
    subtitle: 'Select up to 2',
    required: false,
    multiSelect: true,
    maxSelections: 2,
  },
]

// Preferences types - NEW structure with strength first
// DrinkStrengthValue can be either new format (abv_*) or old format (strength_*)
export type DrinkStrengthPref = DrinkStrengthValue | DrinkStrength | null

export interface DrinkPreferences {
  drinkStrength: DrinkStrengthPref          // FIRST: alcohol level (supports both old and new format)
  drinkFeel: DrinkFeelValue | null          // SECOND: temperature/format
  drinkTaste: DrinkTasteValue[]             // THIRD: flavor tags (multi-select)
  // Legacy fields for backward compatibility
  drinkMood?: DrinkMood | null
  drinkStyle?: DrinkStyle | null
}

export const defaultDrinkPreferences: DrinkPreferences = {
  drinkStrength: null,
  drinkFeel: null,
  drinkTaste: [],
  drinkMood: null,
  drinkStyle: null,
}

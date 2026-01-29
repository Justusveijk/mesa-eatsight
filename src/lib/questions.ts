// Question definitions for guest flow
// Separate questions for food vs drinks

import { MoodTag, FlavorTag, PortionTag, DietTag, PriceTag } from '@/lib/types/taxonomy'

export type DrinkMood = 'drink_refreshing' | 'drink_warming' | 'drink_celebratory' | 'drink_relaxing' | 'drink_energizing'
export type DrinkStyle = 'style_classic' | 'style_adventurous' | 'style_sweet' | 'style_dry' | 'style_bitter'
export type DrinkStrength = 'strength_light' | 'strength_medium' | 'strength_strong' | 'strength_none'

// Food questions (existing)
export const foodMoodOptions: { id: MoodTag; label: string; icon: string }[] = [
  { id: 'mood_comfort', label: 'Comfort / Indulgent', icon: '🍔' },
  { id: 'mood_light', label: 'Fresh / Light', icon: '🥗' },
  { id: 'mood_protein', label: 'High-protein / Filling', icon: '💪' },
  { id: 'mood_warm', label: 'Warm / Cozy', icon: '🍜' },
  { id: 'mood_treat', label: 'Sweet Treat', icon: '🍰' },
]

export const foodFlavorOptions: { id: FlavorTag; label: string; icon: string }[] = [
  { id: 'flavor_umami', label: 'Savoury / Umami', icon: '🧀' },
  { id: 'flavor_spicy', label: 'Spicy', icon: '🌶️' },
  { id: 'flavor_sweet', label: 'Sweet', icon: '🍯' },
  { id: 'flavor_tangy', label: 'Tangy / Sour', icon: '🍋' },
  { id: 'flavor_smoky', label: 'Smoky', icon: '🔥' },
]

export const foodPortionOptions: { id: PortionTag; label: string; icon: string }[] = [
  { id: 'portion_bite', label: 'Just a bite', icon: '🥄' },
  { id: 'portion_standard', label: 'Normal hungry', icon: '🍽️' },
  { id: 'portion_hearty', label: 'Very hungry', icon: '🍖' },
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

export const foodPriceOptions: { id: PriceTag; label: string; icon: string }[] = [
  { id: 'price_1', label: '€ Best value', icon: '💚' },
  { id: 'price_2', label: '€€ Mid-range', icon: '⭐' },
  { id: 'price_3', label: '€€€ Treat yourself', icon: '✨' },
]

// NEW Drink question structure - simplified and reordered
// Question 1: Alcohol strength (FIRST - most important filter)
export type DrinkStrengthValue = 'abv_zero' | 'abv_light' | 'abv_regular' | 'abv_strong'
export const drinkStrengthOptions: { id: DrinkStrengthValue; label: string; icon: string }[] = [
  { id: 'abv_zero', label: 'No alcohol', icon: '🫧' },
  { id: 'abv_light', label: 'Light', icon: '🍃' },
  { id: 'abv_regular', label: 'Regular', icon: '🍸' },
  { id: 'abv_strong', label: 'Strong', icon: '🔥' },
]

// Question 2: Temperature/Feel (SECOND - narrows down further)
export type DrinkFeelValue = 'temp_hot' | 'format_crisp' | 'format_sparkling' | 'format_creamy'
export const drinkFeelOptions: { id: DrinkFeelValue; label: string; icon: string }[] = [
  { id: 'temp_hot', label: 'Warming', icon: '☕' },
  { id: 'format_crisp', label: 'Refreshing / Cold', icon: '🧊' },
  { id: 'format_sparkling', label: 'Bubbly / Sparkling', icon: '✨' },
  { id: 'format_creamy', label: 'Smooth / Creamy', icon: '🥛' },
]

// Question 3: Taste (LAST - fine-tunes the selection)
export type DrinkTasteValue = 'flavor_sweet' | 'flavor_tangy' | 'flavor_bitter' | 'flavor_spicy' | 'flavor_smoky'
export const drinkTasteOptions: { id: DrinkTasteValue; label: string; icon: string }[] = [
  { id: 'flavor_sweet', label: 'Sweet', icon: '🍯' },
  { id: 'flavor_tangy', label: 'Tangy / Citrus', icon: '🍋' },
  { id: 'flavor_bitter', label: 'Bitter', icon: '🫒' },
  { id: 'flavor_spicy', label: 'Spicy', icon: '🌶️' },
  { id: 'flavor_smoky', label: 'Smoky', icon: '🪵' },
]

// Legacy options (keep for backward compatibility during transition)
export const drinkMoodOptions: { id: DrinkMood; label: string; icon: string }[] = [
  { id: 'drink_refreshing', label: 'Something refreshing', icon: '🧊' },
  { id: 'drink_warming', label: 'Something warming', icon: '☕' },
  { id: 'drink_celebratory', label: 'Celebrating!', icon: '🥂' },
  { id: 'drink_relaxing', label: 'Wind down', icon: '🌙' },
  { id: 'drink_energizing', label: 'Pick me up', icon: '⚡' },
]

export const drinkStyleOptions: { id: DrinkStyle; label: string; icon: string }[] = [
  { id: 'style_classic', label: 'Classic / Familiar', icon: '🍷' },
  { id: 'style_adventurous', label: 'Surprise me', icon: '🎲' },
  { id: 'style_sweet', label: 'Sweet', icon: '🍬' },
  { id: 'style_dry', label: 'Dry / Crisp', icon: '🍸' },
  { id: 'style_bitter', label: 'Bitter / Complex', icon: '🍺' },
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

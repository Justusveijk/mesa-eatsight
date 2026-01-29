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

// Drink questions (new)
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

export const drinkStrengthOptions: { id: DrinkStrength; label: string; icon: string }[] = [
  { id: 'strength_none', label: 'Non-alcoholic', icon: '🧃' },
  { id: 'strength_light', label: 'Light (beer, wine)', icon: '🍺' },
  { id: 'strength_medium', label: 'Medium (cocktails)', icon: '🍹' },
  { id: 'strength_strong', label: 'Strong (spirits)', icon: '🥃' },
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

export const drinkQuestions: DrinkQuestion[] = [
  {
    id: 'drinkMood',
    title: 'What kind of drink are you after?',
    subtitle: 'Select one option',
    required: true,
    multiSelect: false,
  },
  {
    id: 'drinkStyle',
    title: 'How do you like it?',
    subtitle: 'Select one option',
    required: true,
    multiSelect: false,
  },
  {
    id: 'drinkStrength',
    title: 'Alcohol preference?',
    subtitle: 'Select one option',
    required: true,
    multiSelect: false,
  },
]

// Preferences types
export interface DrinkPreferences {
  drinkMood: DrinkMood | null
  drinkStyle: DrinkStyle | null
  drinkStrength: DrinkStrength | null
}

export const defaultDrinkPreferences: DrinkPreferences = {
  drinkMood: null,
  drinkStyle: null,
  drinkStrength: null,
}

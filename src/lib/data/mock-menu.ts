import { MenuItem } from '../types/taxonomy'

export const mockVenue = {
  id: 'bella-taverna',
  name: 'Bella Taverna',
  slug: 'bella-taverna',
  address: '123 Main Street, Amsterdam',
}

export const mockMenuItems: MenuItem[] = [
  // Comfort foods
  {
    id: '1',
    name: 'Classic Cheeseburger',
    description: 'Angus beef patty, aged cheddar, house sauce, brioche bun',
    price: 16,
    category: 'Mains',
    tags: ['mood_comfort', 'flavor_umami', 'portion_standard', 'temp_hot', 'protein_red_meat', 'prep_grilled', 'price_2'],
    popularity: 95,
  },
  {
    id: '2',
    name: 'Truffle Mac & Cheese',
    description: 'Three-cheese blend, black truffle oil, crispy breadcrumbs',
    price: 18,
    category: 'Mains',
    tags: ['mood_comfort', 'flavor_umami', 'portion_standard', 'temp_hot', 'diet_vegetarian', 'price_2'],
    popularity: 88,
  },
  {
    id: '3',
    name: 'BBQ Pulled Pork Sandwich',
    description: 'Slow-smoked pork, tangy slaw, pickles, brioche',
    price: 15,
    category: 'Mains',
    tags: ['mood_comfort', 'flavor_smoky', 'flavor_tangy', 'portion_standard', 'temp_hot', 'protein_red_meat', 'price_2'],
    popularity: 82,
  },

  // Light / Fresh
  {
    id: '4',
    name: 'Grilled Salmon Salad',
    description: 'Atlantic salmon, mixed greens, citrus vinaigrette, avocado',
    price: 22,
    category: 'Mains',
    tags: ['mood_light', 'flavor_tangy', 'portion_standard', 'temp_chilled', 'protein_seafood', 'diet_gluten_free', 'prep_grilled', 'price_3'],
    popularity: 78,
  },
  {
    id: '5',
    name: 'Poke Bowl',
    description: 'Ahi tuna, sushi rice, edamame, wakame, sesame',
    price: 19,
    category: 'Mains',
    tags: ['mood_light', 'flavor_umami', 'portion_standard', 'temp_chilled', 'protein_seafood', 'prep_raw_fresh', 'diet_dairy_free', 'price_2'],
    popularity: 85,
  },
  {
    id: '6',
    name: 'Mediterranean Mezze Plate',
    description: 'Hummus, falafel, tabbouleh, pita, pickled vegetables',
    price: 16,
    category: 'Starters',
    tags: ['mood_light', 'flavor_tangy', 'portion_standard', 'temp_room', 'protein_plant', 'diet_vegan', 'diet_dairy_free', 'price_2'],
    popularity: 72,
  },

  // High-protein
  {
    id: '7',
    name: 'Grilled Ribeye Steak',
    description: '300g ribeye, herb butter, roasted vegetables',
    price: 34,
    category: 'Mains',
    tags: ['mood_protein', 'flavor_umami', 'portion_hearty', 'temp_hot', 'protein_red_meat', 'prep_grilled', 'diet_gluten_free', 'price_3'],
    popularity: 90,
    isPush: true,
  },
  {
    id: '8',
    name: 'Chicken Protein Bowl',
    description: 'Grilled chicken breast, quinoa, roasted sweet potato, greens',
    price: 18,
    category: 'Mains',
    tags: ['mood_protein', 'flavor_umami', 'portion_standard', 'temp_hot', 'protein_poultry', 'prep_grilled', 'diet_gluten_free', 'diet_dairy_free', 'price_2'],
    popularity: 80,
  },
  {
    id: '9',
    name: 'Lamb Kofta Platter',
    description: 'Spiced lamb skewers, tzatziki, rice pilaf, grilled vegetables',
    price: 24,
    category: 'Mains',
    tags: ['mood_protein', 'flavor_spicy', 'flavor_umami', 'portion_hearty', 'temp_hot', 'protein_red_meat', 'prep_grilled', 'diet_halal', 'price_3'],
    popularity: 75,
  },

  // Warm / Cozy
  {
    id: '10',
    name: 'Spicy Miso Ramen',
    description: 'Rich tonkotsu broth, chashu pork, soft egg, nori',
    price: 17,
    category: 'Mains',
    tags: ['mood_warm', 'flavor_umami', 'flavor_spicy', 'portion_hearty', 'temp_hot', 'protein_red_meat', 'price_2'],
    popularity: 92,
  },
  {
    id: '11',
    name: 'Mushroom Risotto',
    description: 'Arborio rice, wild mushrooms, parmesan, truffle oil',
    price: 20,
    category: 'Mains',
    tags: ['mood_warm', 'flavor_umami', 'portion_standard', 'temp_hot', 'protein_plant', 'diet_vegetarian', 'diet_gluten_free', 'price_2'],
    popularity: 83,
  },
  {
    id: '12',
    name: 'French Onion Soup',
    description: 'Caramelized onions, beef broth, gruyère crouton',
    price: 12,
    category: 'Starters',
    tags: ['mood_warm', 'flavor_umami', 'portion_bite', 'temp_hot', 'diet_no_pork', 'price_1'],
    popularity: 70,
  },

  // Sweet Treats
  {
    id: '13',
    name: 'Chocolate Lava Cake',
    description: 'Warm molten center, vanilla ice cream, berry coulis',
    price: 11,
    category: 'Desserts',
    tags: ['mood_treat', 'flavor_sweet', 'portion_bite', 'temp_hot', 'diet_vegetarian', 'price_1'],
    popularity: 88,
  },
  {
    id: '14',
    name: 'Crème Brûlée',
    description: 'Classic vanilla custard, caramelized sugar crust',
    price: 10,
    category: 'Desserts',
    tags: ['mood_treat', 'flavor_sweet', 'portion_bite', 'temp_chilled', 'diet_vegetarian', 'diet_gluten_free', 'price_1'],
    popularity: 82,
  },
  {
    id: '15',
    name: 'Vegan Chocolate Mousse',
    description: 'Rich avocado-cocoa mousse, coconut cream, fresh berries',
    price: 10,
    category: 'Desserts',
    tags: ['mood_treat', 'flavor_sweet', 'portion_bite', 'temp_chilled', 'diet_vegan', 'diet_gluten_free', 'diet_dairy_free', 'allergy_nut_free', 'price_1'],
    popularity: 65,
  },

  // Small plates / Bites
  {
    id: '16',
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings, buffalo sauce, blue cheese dip',
    price: 14,
    category: 'Starters',
    tags: ['mood_comfort', 'flavor_spicy', 'portion_bite', 'temp_hot', 'protein_poultry', 'prep_fried_crispy', 'diet_gluten_free', 'price_1'],
    popularity: 91,
  },
  {
    id: '17',
    name: 'Crispy Calamari',
    description: 'Lightly battered squid, lemon aioli, fresh herbs',
    price: 15,
    category: 'Starters',
    tags: ['mood_light', 'flavor_tangy', 'portion_bite', 'temp_hot', 'protein_seafood', 'prep_fried_crispy', 'price_2'],
    popularity: 77,
  },
  {
    id: '18',
    name: 'Burrata & Heirloom Tomato',
    description: 'Fresh burrata, seasonal tomatoes, basil, aged balsamic',
    price: 16,
    category: 'Starters',
    tags: ['mood_light', 'flavor_tangy', 'portion_bite', 'temp_room', 'diet_vegetarian', 'diet_gluten_free', 'prep_raw_fresh', 'price_2'],
    popularity: 79,
  },

  // Additional variety
  {
    id: '19',
    name: 'Thai Green Curry',
    description: 'Coconut curry, vegetables, jasmine rice, choice of tofu or chicken',
    price: 18,
    category: 'Mains',
    tags: ['mood_warm', 'flavor_spicy', 'portion_standard', 'temp_hot', 'protein_plant', 'diet_vegan', 'diet_gluten_free', 'diet_dairy_free', 'price_2'],
    popularity: 84,
  },
  {
    id: '20',
    name: 'Grilled Halloumi Salad',
    description: 'Crispy halloumi, roasted peppers, rocket, pomegranate',
    price: 17,
    category: 'Mains',
    tags: ['mood_light', 'flavor_tangy', 'portion_standard', 'temp_hot', 'diet_vegetarian', 'diet_gluten_free', 'prep_grilled', 'price_2'],
    popularity: 71,
  },
]

// Helper to get price tag from price
export function getPriceTag(price: number, allPrices: number[]): 'price_1' | 'price_2' | 'price_3' {
  const sorted = [...allPrices].sort((a, b) => a - b)
  const p33 = sorted[Math.floor(sorted.length / 3)]
  const p66 = sorted[Math.floor((sorted.length * 2) / 3)]

  if (price <= p33) return 'price_1'
  if (price <= p66) return 'price_2'
  return 'price_3'
}

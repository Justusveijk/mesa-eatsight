import Papa from 'papaparse'
import { MenuTag } from '@/lib/types/taxonomy'
import { DetailedCSVRow, generateTagsFromCSVRow, getTagValidation, isDetailedFormat } from '@/lib/auto-tagger'

export interface CSVRow {
  name: string
  description?: string
  price: string | number
  category: string
  type?: 'food' | 'drink' | string
  subcategory?: string
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
  currency?: string
}

export interface ParsedItem {
  name: string
  description: string | null
  price: number
  category: string
  type: 'food' | 'drink'
  isValid: boolean
  errors: string[]
  autoTags: MenuTag[]
  tagValidation: { isValid: boolean; missing: string[] }
  rawRow: CSVRow
}

export interface ParseResult {
  items: ParsedItem[]
  errors: string[]
  hasErrors: boolean
  isDetailedFormat: boolean
  summary: {
    total: number
    ready: number
    needsReview: number
  }
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const items: ParsedItem[] = []
        const globalErrors: string[] = []

        // Check for required columns
        const headers = results.meta.fields || []
        if (!headers.includes('name')) {
          globalErrors.push('Missing required column: name')
        }
        if (!headers.includes('price')) {
          globalErrors.push('Missing required column: price')
        }

        if (globalErrors.length > 0) {
          resolve({
            items: [],
            errors: globalErrors,
            hasErrors: true,
            isDetailedFormat: false,
            summary: { total: 0, ready: 0, needsReview: 0 },
          })
          return
        }

        // Detect if this is detailed format
        const detailed = isDetailedFormat(headers)

        results.data.forEach((row, index) => {
          const errors: string[] = []

          // Validate name
          const name = row.name?.toString().trim()
          if (!name) {
            errors.push('Name is required')
          }

          // Validate and parse price
          let price = 0
          const rawPrice = row.price
          if (rawPrice === undefined || rawPrice === '') {
            errors.push('Price is required')
          } else {
            // Handle both string and number, remove currency symbols
            const priceStr = String(rawPrice).replace(/[€$£,]/g, '').trim()
            price = parseFloat(priceStr)
            if (isNaN(price)) {
              errors.push(`Invalid price: "${rawPrice}"`)
            } else if (price < 0) {
              errors.push('Price cannot be negative')
            }
          }

          // Validate category (optional but recommended)
          const category = row.category?.toString().trim() || 'Uncategorized'

          // Determine type (food or drink)
          let itemType: 'food' | 'drink' = 'food'
          if (row.type) {
            const typeValue = row.type.toString().toLowerCase().trim()
            if (typeValue === 'drink' || typeValue === 'drinks') {
              itemType = 'drink'
            }
          } else {
            // Infer from category if type not provided
            const categoryLower = category.toLowerCase()
            const drinkCategories = [
              'drinks', 'cocktails', 'wine', 'wines', 'beer', 'beers',
              'mocktails', 'soft drinks', 'smoothies', 'coffee', 'hot drinks',
              'beverages', 'juices', 'tea', 'spirits', 'sodas', 'water'
            ]
            if (drinkCategories.some(dc => categoryLower.includes(dc))) {
              itemType = 'drink'
            }
          }

          // Generate auto-tags if detailed format
          let autoTags: MenuTag[] = []
          if (detailed) {
            autoTags = generateTagsFromCSVRow(row as DetailedCSVRow)
          }

          // Parse direct tags from CSV if provided
          if (row.tags) {
            const directTags = row.tags.toString().split(',').map(t => t.trim()).filter(Boolean) as MenuTag[]
            autoTags = [...new Set([...autoTags, ...directTags])]
          }

          // Validate tags
          const tagValidation = getTagValidation(autoTags)

          items.push({
            name: name || `Row ${index + 2}`,
            description: row.description?.toString().trim() || null,
            price,
            category,
            type: itemType,
            isValid: errors.length === 0,
            errors,
            autoTags,
            tagValidation,
            rawRow: row,
          })
        })

        const hasErrors = items.some((item) => !item.isValid) || globalErrors.length > 0
        const readyCount = items.filter(item => item.isValid && item.tagValidation.isValid).length
        const needsReviewCount = items.filter(item => item.isValid && !item.tagValidation.isValid).length

        resolve({
          items,
          errors: globalErrors,
          hasErrors,
          isDetailedFormat: detailed,
          summary: {
            total: items.length,
            ready: readyCount,
            needsReview: needsReviewCount,
          },
        })
      },
      error: (error) => {
        resolve({
          items: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          hasErrors: true,
          isDetailedFormat: false,
          summary: { total: 0, ready: 0, needsReview: 0 },
        })
      },
    })
  })
}

export function generateSimpleCSVTemplate(): string {
  const headers = ['name', 'description', 'price', 'category', 'type']
  const exampleRows = [
    ['Classic Burger', 'Beef patty with cheese and house sauce', '14.50', 'Mains', 'food'],
    ['Caesar Salad', 'Romaine lettuce with parmesan and croutons', '12.00', 'Starters', 'food'],
    ['Margherita Pizza', 'Fresh tomato, mozzarella, and basil', '16.00', 'Mains', 'food'],
    ['Tiramisu', 'Classic Italian dessert with mascarpone', '8.50', 'Desserts', 'food'],
    ['House Red Wine', 'Medium-bodied Merlot, glass', '7.00', 'Wine', 'drink'],
    ['Espresso Martini', 'Vodka, coffee liqueur, fresh espresso', '13.00', 'Cocktails', 'drink'],
  ]

  return Papa.unparse({
    fields: headers,
    data: exampleRows,
  })
}

export function generateDetailedCSVTemplate(): string {
  const headers = [
    'name',
    'description',
    'price',
    'category',
    'type',
    'tags',
    'dietary',
    'allergens',
    'sweetness_0_5',
    'bitterness_0_5',
    'sourness_0_5',
    'spice_0_3',
    'intensity_0_5',
    'volume_ml',
    'abv_percent',
  ]

  const exampleRows = [
    // Food items - with direct tags
    ['Classic Burger', 'Grilled beef patty with cheddar cheese and smoky BBQ sauce', '14.50', 'Mains', 'food', 'mood_comfort,flavor_umami,portion_standard,temp_hot,protein_red_meat', '', 'gluten,dairy', '2', '1', '1', '1', '4', '', ''],
    ['Caesar Salad', 'Fresh romaine lettuce with parmesan, croutons and house dressing', '12.00', 'Starters', 'food', 'mood_light,flavor_tangy,portion_bite,temp_chilled,diet_vegetarian', 'vegetarian', 'gluten,dairy,eggs', '1', '1', '2', '0', '2', '', ''],
    ['Spicy Thai Curry', 'Coconut curry with vegetables, served with jasmine rice', '16.00', 'Mains', 'food', 'mood_warm,flavor_spicy,portion_standard,temp_hot,diet_vegan,protein_plant', 'vegan', '', '2', '0', '1', '3', '4', '', ''],
    ['Fish & Chips', 'Beer-battered cod with crispy fried chips and tartar sauce', '18.00', 'Mains', 'food', 'mood_comfort,flavor_umami,portion_hearty,temp_hot,protein_seafood,prep_fried_crispy', '', 'gluten,fish', '1', '1', '1', '0', '3', '', ''],
    ['Truffle Fries', 'Crispy fries with parmesan and truffle oil', '8.50', 'Snacks', 'food', 'mood_treat,flavor_umami,portion_bite,temp_hot,diet_vegetarian,prep_fried_crispy', 'vegetarian', 'gluten,dairy', '1', '0', '0', '0', '3', '', ''],
    ['Tiramisu', 'Classic Italian dessert with mascarpone and espresso', '8.50', 'Desserts', 'food', 'mood_treat,flavor_sweet,portion_bite,temp_chilled', 'vegetarian', 'gluten,dairy,eggs', '4', '2', '0', '0', '3', '', ''],
    // Drink items
    ['Margarita', 'Classic lime margarita with premium tequila', '12.00', 'Cocktails', 'drink', 'mood_treat,flavor_tangy,temp_chilled', 'vegan', '', '2', '0', '4', '0', '3', '200', '15'],
    ['Old Fashioned', 'Bourbon with bitters and orange peel', '14.00', 'Cocktails', 'drink', 'mood_comfort,flavor_smoky,temp_chilled', 'vegan', '', '2', '3', '0', '0', '5', '100', '30'],
    ['House Red Wine', 'Medium-bodied Merlot, glass', '7.00', 'Wine', 'drink', 'mood_comfort,flavor_tangy,temp_room', 'vegan', 'sulphites', '1', '2', '1', '0', '3', '150', '13'],
    ['Virgin Mojito', 'Fresh mint, lime, soda water', '8.00', 'Mocktails', 'drink', 'mood_light,flavor_tangy,temp_chilled', 'vegan', '', '3', '0', '3', '0', '2', '300', '0'],
    ['Flat White', 'Double espresso with velvety steamed milk', '4.50', 'Coffee', 'drink', 'mood_warm,flavor_umami,temp_hot', 'vegetarian', 'dairy', '1', '2', '0', '0', '3', '180', '0'],
  ]

  return Papa.unparse({
    fields: headers,
    data: exampleRows,
  })
}

// Legacy function for backwards compatibility
export function generateCSVTemplate(): string {
  return generateSimpleCSVTemplate()
}

export function downloadSimpleTemplate() {
  const csv = generateSimpleCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'menu-template-simple.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadDetailedTemplate() {
  const csv = generateDetailedCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'menu-template-detailed.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Legacy function for backwards compatibility
export function downloadCSVTemplate() {
  downloadSimpleTemplate()
}

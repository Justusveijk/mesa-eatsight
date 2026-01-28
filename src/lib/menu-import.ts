import Papa from 'papaparse'
import { MenuTag } from '@/lib/types/taxonomy'
import { DetailedCSVRow, generateTagsFromCSVRow, getTagValidation, isDetailedFormat } from '@/lib/auto-tagger'

export interface CSVRow {
  name: string
  description?: string
  price: string | number
  category: string
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

          // Generate auto-tags if detailed format
          let autoTags: MenuTag[] = []
          if (detailed) {
            autoTags = generateTagsFromCSVRow(row as DetailedCSVRow)
          }

          // Validate tags
          const tagValidation = getTagValidation(autoTags)

          items.push({
            name: name || `Row ${index + 2}`,
            description: row.description?.toString().trim() || null,
            price,
            category,
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
  const headers = ['name', 'description', 'price', 'category']
  const exampleRows = [
    ['Classic Burger', 'Beef patty with cheese and house sauce', '14.50', 'Mains'],
    ['Caesar Salad', 'Romaine lettuce with parmesan and croutons', '12.00', 'Starters'],
    ['Margherita Pizza', 'Fresh tomato, mozzarella, and basil', '16.00', 'Mains'],
    ['Tiramisu', 'Classic Italian dessert with mascarpone', '8.50', 'Desserts'],
    ['House Wine', 'Red or white, glass', '7.00', 'Drinks'],
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
    'category',
    'subcategory',
    'price',
    'currency',
    'dietary',
    'allergens',
    'sweetness_0_5',
    'bitterness_0_5',
    'sourness_0_5',
    'spice_0_3',
    'intensity_0_5',
    'volume_ml',
    'abv_percent',
    'base',
    'availability',
  ]

  const exampleRows = [
    // Food items
    ['Classic Burger', 'Grilled beef patty with cheddar cheese and smoky BBQ sauce', 'Mains', 'Burgers', '14.50', 'EUR', '', 'gluten,dairy', '2', '1', '1', '1', '4', '', '', '', 'always'],
    ['Caesar Salad', 'Fresh romaine lettuce with parmesan, croutons and house dressing', 'Starters', 'Salads', '12.00', 'EUR', 'vegetarian', 'gluten,dairy,eggs', '1', '1', '2', '0', '2', '', '', '', 'always'],
    ['Spicy Thai Curry', 'Coconut curry with vegetables, served with jasmine rice', 'Mains', 'Asian', '16.00', 'EUR', 'vegan', '', '2', '0', '1', '3', '4', '', '', '', 'always'],
    ['Fish & Chips', 'Beer-battered cod with crispy fried chips and tartar sauce', 'Mains', 'Seafood', '18.00', 'EUR', '', 'gluten,fish', '1', '1', '1', '0', '3', '', '', '', 'always'],
    ['Truffle Fries', 'Crispy fries with parmesan and truffle oil', 'Snacks', 'Sharing', '8.50', 'EUR', 'vegetarian', 'gluten,dairy', '1', '0', '0', '0', '3', '', '', '', 'always'],
    ['Tiramisu', 'Classic Italian dessert with mascarpone and espresso', 'Desserts', 'Sweet', '8.50', 'EUR', 'vegetarian', 'gluten,dairy,eggs', '4', '2', '0', '0', '3', '', '', '', 'always'],
    // Drink items
    ['Margarita', 'Classic lime margarita with premium tequila', 'Cocktails', 'Classic', '12.00', 'EUR', 'vegan', '', '2', '0', '4', '0', '3', '200', '15', 'tequila', 'always'],
    ['Old Fashioned', 'Bourbon with bitters and orange peel', 'Cocktails', 'Classic', '14.00', 'EUR', 'vegan', '', '2', '3', '0', '0', '5', '100', '30', 'whiskey', 'always'],
    ['House Red Wine', 'Medium-bodied Merlot, glass', 'Wine', 'Red', '7.00', 'EUR', 'vegan', 'sulphites', '1', '2', '1', '0', '3', '150', '13', 'grape', 'always'],
    ['IPA Beer', 'Hoppy India Pale Ale, draft', 'Beer', 'Craft', '6.50', 'EUR', 'vegan', 'gluten', '0', '4', '1', '0', '4', '500', '6', 'barley', 'always'],
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

'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
  X,
  FileText,
  MoreHorizontal,
  Download,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Zap,
  Eye,
} from 'lucide-react'
import { TagEditor } from '@/components/dashboard/TagEditor'
import { MenuTag, TAG_LABELS } from '@/lib/types/taxonomy'
import { parseCSV, ParsedItem, ParseResult, downloadDetailedTemplate } from '@/lib/menu-import'
import { createClient } from '@/lib/supabase/client'

type StockStatus = 'available' | 'out_today' | 'out_indefinitely'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  type: 'food' | 'drink'
  popularity_score: number
  is_push: boolean
  is_out_of_stock: boolean
  stock_status: StockStatus
  tags: MenuTag[]
}

interface MenuData {
  id: string
  status: string
  published_at: string | null
}

interface PreviewItem extends ParsedItem {
  editedTags: MenuTag[]
  editedType?: 'food' | 'drink'
}

interface NewItemForm {
  name: string
  description: string
  price: string
  category: string
  type: 'food' | 'drink'
}

const defaultNewItem: NewItemForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  type: 'food',
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // CSV Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [importing, setImporting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Preview tag editing
  const [editingPreviewIndex, setEditingPreviewIndex] = useState<number | null>(null)

  // Add Item modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState<NewItemForm>(defaultNewItem)
  const [newItemTags, setNewItemTags] = useState<MenuTag[]>([])
  const [addingItem, setAddingItem] = useState(false)
  const [showNewItemTagEditor, setShowNewItemTagEditor] = useState(false)

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deletingBulk, setDeletingBulk] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Expanded categories for table view
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchMenuData = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!operatorUser?.venue_id) return

    const { data: menuData } = await supabase
      .from('menus')
      .select('id, status, published_at')
      .eq('venue_id', operatorUser.venue_id)
      .in('status', ['draft', 'published'])
      .single()

    if (!menuData) {
      setLoading(false)
      return
    }

    setMenu(menuData)

    const { data: itemsData } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        category,
        type,
        popularity_score,
        is_push,
        is_out_of_stock,
        stock_status,
        item_tags (tag)
      `)
      .eq('menu_id', menuData.id)
      .order('category')
      .order('name')

    if (itemsData) {
      const transformedItems: MenuItem[] = itemsData.map((item) => {
        let stockStatus: StockStatus = 'available'
        if ((item as Record<string, unknown>).stock_status) {
          stockStatus = (item as Record<string, unknown>).stock_status as StockStatus
        } else if (item.is_out_of_stock) {
          stockStatus = 'out_indefinitely'
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          type: (item.type as 'food' | 'drink') || 'food',
          popularity_score: item.popularity_score || 0,
          is_push: item.is_push || false,
          is_out_of_stock: item.is_out_of_stock || false,
          stock_status: stockStatus,
          tags: (item.item_tags as { tag: string }[])?.map((t) => t.tag as MenuTag) || [],
        }
      })
      setItems(transformedItems)
      // Expand all categories by default
      const cats = new Set(transformedItems.map(i => i.category))
      setExpandedCategories(cats)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  // Computed values
  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    items.forEach(item => {
      cats.set(item.category, (cats.get(item.category) || 0) + 1)
    })
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }))
  }, [items])

  const stockCounts = useMemo(() => ({
    all: items.length,
    available: items.filter(i => i.stock_status === 'available').length,
    out_today: items.filter(i => i.stock_status === 'out_today').length,
    out_indefinitely: items.filter(i => i.stock_status === 'out_indefinitely').length,
  }), [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || item.category === selectedCategory
      const matchesStock = stockFilter === 'all' || item.stock_status === stockFilter
      return matchesSearch && matchesCategory && matchesStock
    })
  }, [items, searchQuery, selectedCategory, stockFilter])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, MenuItem[]>()
    filteredItems.forEach(item => {
      const existing = groups.get(item.category) || []
      groups.set(item.category, [...existing, item])
    })
    return groups
  }, [filteredItems])

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    setExpandedCategories(next)
  }

  const handleSaveTags = async (tags: MenuTag[]) => {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save tags')
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, tags } : item
        )
      )
      setEditingItem(null)
      showToast('Tags saved', 'success')
    } catch (error) {
      showToast(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const handleSavePreviewTags = (index: number, tags: MenuTag[]) => {
    setPreviewItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editedTags: tags } : item
      )
    )
    setEditingPreviewIndex(null)
  }

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.price || !menu) {
      showToast('Name and price required', 'error')
      return
    }

    setAddingItem(true)

    try {
      const response = await fetch('/api/menu/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: newItem.name.trim(),
            description: newItem.description.trim() || null,
            price: parseFloat(newItem.price) || 0,
            category: newItem.category.trim() || 'Uncategorized',
            type: newItem.type,
            tags: newItemTags,
          }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item')
      }

      showToast('Item added', 'success')
      setShowAddModal(false)
      setNewItem(defaultNewItem)
      setNewItemTags([])
      fetchMenuData()
    } catch (error) {
      showToast(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setAddingItem(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    if (!confirm(`Delete ${selectedItems.length} items?`)) return

    setDeletingBulk(true)

    try {
      const supabase = createClient()

      await supabase
        .from('item_tags')
        .delete()
        .in('item_id', selectedItems)

      const { error: itemError } = await supabase
        .from('menu_items')
        .delete()
        .in('id', selectedItems)

      if (itemError) {
        showToast('Failed to delete items', 'error')
      } else {
        showToast(`Deleted ${selectedItems.length} items`, 'success')
        setSelectedItems([])
        fetchMenuData()
      }
    } catch {
      showToast('Failed to delete items', 'error')
    } finally {
      setDeletingBulk(false)
    }
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const setStockStatus = async (id: string, status: StockStatus) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const previousStatus = item.stock_status
    const isOutOfStock = status !== 'available'

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, stock_status: status, is_out_of_stock: isOutOfStock } : i))
    )

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_status: status, is_out_of_stock: isOutOfStock }),
      })

      if (!response.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, stock_status: previousStatus, is_out_of_stock: previousStatus !== 'available' } : i))
        )
        showToast('Failed to update status', 'error')
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stock_status: previousStatus, is_out_of_stock: previousStatus !== 'available' } : i))
      )
      showToast('Failed to update status', 'error')
    }
  }

  const togglePush = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newValue = !item.is_push

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_push: newValue } : i))
    )

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_push: newValue }),
      })

      if (!response.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_push: !newValue } : i))
        )
        showToast('Failed to update', 'error')
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_push: !newValue } : i))
      )
      showToast('Failed to update', 'error')
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return

    const itemToDelete = items.find((i) => i.id === id)

    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedItems((prev) => prev.filter((i) => i !== id))

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (itemToDelete) {
          setItems((prev) => [...prev, itemToDelete])
        }
        showToast('Failed to delete', 'error')
      } else {
        showToast('Item deleted', 'success')
      }
    } catch {
      if (itemToDelete) {
        setItems((prev) => [...prev, itemToDelete])
      }
      showToast('Failed to delete', 'error')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      await handleFileSelect(file)
    } else {
      showToast('Please upload a CSV file', 'error')
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async (file: File) => {
    const result = await parseCSV(file)
    setParseResult(result)
    setPreviewItems(result.items.map(item => ({
      ...item,
      editedTags: item.autoTags,
      editedType: item.type,
    })))
  }

  const handleImport = async () => {
    if (!previewItems.length) return

    const validItems = previewItems.filter((item) => item.isValid)
    if (validItems.length === 0) {
      showToast('No valid items to import', 'error')
      return
    }

    setImporting(true)

    try {
      const response = await fetch('/api/menu/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map((item) => ({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            type: item.type,
            tags: item.editedTags,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import')
      }

      showToast(`Imported ${data.count} items`, 'success')
      setParseResult(null)
      setPreviewItems([])
      fetchMenuData()
    } catch (error) {
      showToast(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleCancelPreview = () => {
    setParseResult(null)
    setPreviewItems([])
  }

  const handlePublish = async () => {
    if (!menu) return

    setPublishing(true)

    try {
      const response = await fetch('/api/menu/publish', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      showToast(data.message, 'success')
      setMenu({ ...menu, status: 'published', published_at: new Date().toISOString() })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to publish', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const hasRequiredTags = (tags: MenuTag[]) => {
    const hasMood = tags.some((t) => t.startsWith('mood_'))
    const hasPortion = tags.some((t) => t.startsWith('portion_'))
    const hasTemp = tags.some((t) => t.startsWith('temp_'))
    return hasMood && hasPortion && hasTemp
  }

  const previewSummary = {
    total: previewItems.length,
    valid: previewItems.filter(i => i.isValid).length,
    ready: previewItems.filter(i => i.isValid && hasRequiredTags(i.editedTags)).length,
    needsReview: previewItems.filter(i => i.isValid && !hasRequiredTags(i.editedTags)).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-neutral-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Menu</h1>
              <p className="text-sm text-neutral-500">
                {items.length} items
                {menu?.status === 'published' && <span className="ml-2 text-green-600">(Published)</span>}
                {menu?.status === 'draft' && <span className="ml-2 text-amber-600">(Draft)</span>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePublish}
                disabled={publishing || items.length === 0}
                className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-3 mb-4 bg-neutral-100 rounded-md"
            >
              <span className="text-sm font-medium text-neutral-700">
                {selectedItems.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={deletingBulk}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
              >
                {deletingBulk ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200 rounded-md transition"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSV Preview */}
        <AnimatePresence>
          {parseResult && previewItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-neutral-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-neutral-900">Import Preview</h3>
                  <p className="text-sm text-neutral-500">
                    {previewSummary.valid} of {previewSummary.total} items valid
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelPreview}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || previewSummary.valid === 0}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md disabled:opacity-50 transition"
                  >
                    {importing ? 'Importing...' : `Import ${previewSummary.valid}`}
                  </button>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {parseResult.errors.map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-neutral-50">
                    <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider">
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {previewItems.slice(0, 20).map((item, i) => (
                      <tr key={i} className={!item.isValid ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2">
                          {item.isValid ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-neutral-900">{item.name}</td>
                        <td className="px-3 py-2 text-neutral-600 tabular-nums">
                          {item.isValid ? `€${item.price.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-neutral-600">{item.category}</td>
                        <td className="px-3 py-2 text-right">
                          {item.isValid && (
                            <button
                              onClick={() => setEditingPreviewIndex(i)}
                              className="text-xs text-neutral-500 hover:text-neutral-900"
                            >
                              Edit tags
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop Zone (when no items) */}
        {!parseResult && items.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer mb-6 ${
              isDragging
                ? 'border-neutral-400 bg-neutral-100'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium mb-1">
              Drop CSV file here or click to upload
            </p>
            <p className="text-sm text-neutral-500">
              Or add items manually with the button above
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); downloadDetailedTemplate(); }}
              className="mt-4 text-sm text-neutral-500 hover:text-neutral-700 underline"
            >
              Download CSV template
            </button>
          </div>
        )}

        {/* Filters */}
        {items.length > 0 && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                />
              </div>

              {/* Stock Filter */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md">
                {[
                  { value: 'all', label: 'All', count: stockCounts.all },
                  { value: 'available', label: 'Available', count: stockCounts.available },
                  { value: 'out_today', label: 'Out Today', count: stockCounts.out_today },
                  { value: 'out_indefinitely', label: 'Out', count: stockCounts.out_indefinitely },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStockFilter(option.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                      stockFilter === option.value
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {option.label}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      stockFilter === option.value
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400'
                  }`}
                  title="Table view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  !selectedCategory
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                All categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition ${
                    selectedCategory === cat.name
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {cat.name}
                  <span className="ml-1.5 text-[10px] opacity-60">{cat.count}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Content */}
        {items.length === 0 ? null : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-neutral-900 mb-1">No items found</h3>
            <p className="text-sm text-neutral-500">
              {searchQuery ? `No items match "${searchQuery}"` : 'Try adjusting your filters'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="space-y-3">
            {Array.from(groupedItems.entries()).map(([category, categoryItems]) => (
              <div key={category} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${
                      expandedCategories.has(category) ? 'rotate-90' : ''
                    }`} />
                    <span className="text-sm font-medium text-neutral-900">{category}</span>
                    <span className="text-xs text-neutral-400">{categoryItems.length} items</span>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedCategories.has(category) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <table className="w-full">
                        <thead className="border-b border-neutral-100">
                          <tr className="text-xs text-neutral-500 uppercase tracking-wider">
                            <th className="px-4 py-2 text-left font-medium w-8"></th>
                            <th className="px-4 py-2 text-left font-medium">Item</th>
                            <th className="px-4 py-2 text-left font-medium">Tags</th>
                            <th className="px-4 py-2 text-right font-medium">Price</th>
                            <th className="px-4 py-2 text-center font-medium">Status</th>
                            <th className="px-4 py-2 text-center font-medium">Push</th>
                            <th className="px-4 py-2 text-right font-medium w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {categoryItems.map((item) => (
                            <tr key={item.id} className={`hover:bg-neutral-50 transition ${
                              item.stock_status !== 'available' ? 'opacity-60' : ''
                            }`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                                    item.type === 'food'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-purple-50 text-purple-700'
                                  }`}>
                                    {item.type === 'food' ? 'F' : 'D'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                                    <p className="text-xs text-neutral-500 line-clamp-1 max-w-xs">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="flex flex-wrap gap-1 hover:opacity-70"
                                >
                                  {item.tags.slice(0, 2).map(tag => (
                                    <span
                                      key={tag}
                                      className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-600 rounded"
                                    >
                                      {TAG_LABELS[tag]}
                                    </span>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <span className="text-[10px] text-neutral-400">+{item.tags.length - 2}</span>
                                  )}
                                  {item.tags.length === 0 && (
                                    <span className="text-[10px] text-neutral-400">+ Add tags</span>
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-medium text-neutral-900 tabular-nums">
                                  €{item.price.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={item.stock_status}
                                  onChange={(e) => setStockStatus(item.id, e.target.value as StockStatus)}
                                  className={`px-2 py-1 text-xs font-medium rounded border-0 cursor-pointer focus:ring-2 focus:ring-neutral-900/10 ${
                                    item.stock_status === 'available' ? 'text-green-700 bg-green-50' :
                                    item.stock_status === 'out_today' ? 'text-amber-700 bg-amber-50' :
                                    'text-red-700 bg-red-50'
                                  }`}
                                >
                                  <option value="available">Available</option>
                                  <option value="out_today">Out Today</option>
                                  <option value="out_indefinitely">Out</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => togglePush(item.id)}
                                  className={`p-1.5 rounded transition ${
                                    item.is_push
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100'
                                  }`}
                                  title={item.is_push ? 'Remove from pushed' : 'Push item'}
                                >
                                  <Zap className={`w-4 h-4 ${item.is_push ? 'fill-current' : ''}`} />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  <AnimatePresence>
                                    {openMenuId === item.id && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.95 }}
                                          className="absolute right-0 top-full mt-1 w-36 bg-white border border-neutral-200 rounded-md shadow-lg z-20 py-1"
                                        >
                                          <button
                                            onClick={() => { setEditingItem(item); setOpenMenuId(null); }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            Edit Tags
                                          </button>
                                          <hr className="my-1 border-neutral-100" />
                                          <button
                                            onClick={() => { deleteItem(item.id); setOpenMenuId(null); }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                          </button>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition ${
                  item.stock_status !== 'available' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    item.type === 'food'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-purple-50 text-purple-700'
                  }`}>
                    {item.type === 'food' ? 'Food' : 'Drink'}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openMenuId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-32 bg-white border border-neutral-200 rounded-md shadow-lg z-20 py-1"
                          >
                            <button
                              onClick={() => { setEditingItem(item); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => { deleteItem(item.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-neutral-900 mb-1">{item.name}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                    €{item.price.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1">
                    <select
                      value={item.stock_status}
                      onChange={(e) => setStockStatus(item.id, e.target.value as StockStatus)}
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded border-0 cursor-pointer ${
                        item.stock_status === 'available' ? 'text-green-700 bg-green-50' :
                        item.stock_status === 'out_today' ? 'text-amber-700 bg-amber-50' :
                        'text-red-700 bg-red-50'
                      }`}
                    >
                      <option value="available">Available</option>
                      <option value="out_today">Out Today</option>
                      <option value="out_indefinitely">Out</option>
                    </select>
                    <button
                      onClick={() => togglePush(item.id)}
                      className={`p-1 rounded transition ${
                        item.is_push
                          ? 'bg-violet-100 text-violet-700'
                          : 'text-neutral-300 hover:text-neutral-500'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${item.is_push ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-lg shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h2 className="font-semibold text-neutral-900">Add Item</h2>
                <button
                  onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Classic Burger"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Describe the item..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewItem({ ...newItem, type: 'food' })}
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition ${
                        newItem.type === 'food'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      Food
                    </button>
                    <button
                      onClick={() => setNewItem({ ...newItem, type: 'drink' })}
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition ${
                        newItem.type === 'drink'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      Drink
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="e.g., Mains"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tags</label>
                  <button
                    onClick={() => setShowNewItemTagEditor(true)}
                    className="w-full px-3 py-2 text-sm text-left border border-neutral-200 rounded-md hover:border-neutral-300 transition"
                  >
                    {newItemTags.length > 0 ? (
                      <span className="text-neutral-700">{newItemTags.length} tags selected</span>
                    ) : (
                      <span className="text-neutral-400">Click to add tags...</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 border-t border-neutral-200">
                <button
                  onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
                  className="flex-1 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={addingItem || !newItem.name.trim() || !newItem.price}
                  className="flex-1 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition"
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Editor Modals */}
      {editingItem && (
        <TagEditor
          item={{
            id: editingItem.id,
            name: editingItem.name,
            description: editingItem.description || '',
            price: editingItem.price,
            category: editingItem.category,
            tags: editingItem.tags,
            popularity: editingItem.popularity_score,
            isPush: editingItem.is_push,
            isOutOfStock: editingItem.is_out_of_stock,
          }}
          onSave={handleSaveTags}
          onClose={() => setEditingItem(null)}
        />
      )}

      {editingPreviewIndex !== null && previewItems[editingPreviewIndex] && (
        <TagEditor
          item={{
            id: `preview-${editingPreviewIndex}`,
            name: previewItems[editingPreviewIndex].name,
            description: previewItems[editingPreviewIndex].description || '',
            price: previewItems[editingPreviewIndex].price,
            category: previewItems[editingPreviewIndex].category,
            tags: previewItems[editingPreviewIndex].editedTags,
            popularity: 0,
            isPush: false,
            isOutOfStock: false,
          }}
          onSave={(tags) => handleSavePreviewTags(editingPreviewIndex, tags)}
          onClose={() => setEditingPreviewIndex(null)}
        />
      )}

      {showNewItemTagEditor && (
        <TagEditor
          item={{
            id: 'new-item',
            name: newItem.name || 'New Item',
            description: newItem.description || '',
            price: parseFloat(newItem.price) || 0,
            category: newItem.category || 'Uncategorized',
            tags: newItemTags,
            popularity: 0,
            isPush: false,
            isOutOfStock: false,
          }}
          onSave={(tags) => {
            setNewItemTags(tags)
            setShowNewItemTagEditor(false)
          }}
          onClose={() => setShowNewItemTagEditor(false)}
        />
      )}
    </div>
  )
}

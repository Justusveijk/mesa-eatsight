'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Search,
  Star,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
  X,
  FileText,
  HelpCircle,
  Wine,
  Utensils,
  ChefHat,
  Target,
  BarChart3,
  Eye,
  EyeOff,
  MoreHorizontal,
  Download,
  Sparkles,
  Salad,
  Beef,
  Fish,
  Leaf,
  IceCream,
  Coffee,
  Clock,
  Ban,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { TagEditor } from '@/components/dashboard/TagEditor'
import { MenuTag, TAG_LABELS } from '@/lib/types/taxonomy'
import { parseCSV, ParsedItem, ParseResult, downloadDetailedTemplate } from '@/lib/menu-import'
import { createClient } from '@/lib/supabase/client'
import { ScrollReveal } from '@/components/ScrollReveal'

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

// Category icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  starters: Salad,
  mains: Beef,
  fish: Fish,
  vegetarian: Leaf,
  desserts: IceCream,
  drinks: Wine,
  coffee: Coffee,
  default: Utensils,
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | StockStatus>('all')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // CSV Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [importing, setImporting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showChefModal, setShowChefModal] = useState(false)

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
        // Derive stock_status from is_out_of_stock for backwards compatibility
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
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))]

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStock = stockFilter === 'all' || item.stock_status === stockFilter
    return matchesSearch && matchesCategory && matchesStock
  })

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
      showToast('Tags saved successfully', 'success')
    } catch (error) {
      showToast(`Failed to save tags: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
      showToast('Name and price are required', 'error')
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

      if (data.tagError) {
        showToast(`Item added but tags failed: ${data.tagError}`, 'error')
      } else {
        showToast('Item added successfully', 'success')
      }

      setShowAddModal(false)
      setNewItem(defaultNewItem)
      setNewItemTags([])
      fetchMenuData()
    } catch (error) {
      showToast(`Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setAddingItem(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return

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

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map((i) => i.id))
    }
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
        showToast('Failed to update stock status', 'error')
      } else {
        const statusLabels: Record<StockStatus, string> = {
          available: 'Available',
          out_today: 'Out Today',
          out_indefinitely: 'Out Indefinitely',
        }
        showToast(`Stock status: ${statusLabels[status]}`, 'success')
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stock_status: previousStatus, is_out_of_stock: previousStatus !== 'available' } : i))
      )
      showToast('Failed to update stock status', 'error')
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
        showToast('Failed to update featured status', 'error')
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_push: !newValue } : i))
      )
      showToast('Failed to update featured status', 'error')
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

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
        showToast('Failed to delete item', 'error')
      } else {
        showToast('Item deleted', 'success')
      }
    } catch {
      if (itemToDelete) {
        setItems((prev) => [...prev, itemToDelete])
      }
      showToast('Failed to delete item', 'error')
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

      if (data.tagError) {
        showToast(`Imported ${data.count} items but tags failed: ${data.tagError}`, 'error')
      } else {
        showToast(`Imported ${data.count} items with ${data.tagsInserted || 0} tags`, 'success')
      }

      setParseResult(null)
      setPreviewItems([])
      fetchMenuData()
    } catch (error) {
      showToast(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
      showToast(error instanceof Error ? error.message : 'Failed to publish menu', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const getDisplayTags = (tags: MenuTag[]) => {
    return tags.filter((t) => !t.startsWith('price_')).slice(0, 3)
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
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mesa-burgundy"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-serif text-mesa-charcoal"
            >
              Menu Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-mesa-charcoal/50 mt-1"
            >
              {items.length} items
              {menu?.status === 'published' && (
                <span className="ml-2 text-green-600">(Published)</span>
              )}
              {menu?.status === 'draft' && (
                <span className="ml-2 text-amber-600">(Draft)</span>
              )}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3"
          >
            <button
              onClick={handlePublish}
              disabled={publishing || items.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-mesa-charcoal/70 hover:text-mesa-charcoal transition disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Menu'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-mesa-burgundy text-white rounded-xl text-sm font-medium hover:bg-mesa-burgundy/90 transition shadow-lg shadow-mesa-burgundy/20"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </motion.div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-4 mb-6 glass rounded-xl border-l-4 border-mesa-burgundy"
            >
              <span className="text-mesa-charcoal font-medium">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={deletingBulk}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deletingBulk ? 'Deleting...' : 'Delete selected'}
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 rounded-xl text-sm text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 transition"
              >
                Clear selection
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
              className="glass rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-mesa-charcoal">Preview Import</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-mesa-charcoal/50">
                      {previewSummary.valid} of {previewSummary.total} items valid
                    </span>
                    {parseResult.isDetailedFormat && (
                      <>
                        <span className="text-green-600">{previewSummary.ready} ready</span>
                        {previewSummary.needsReview > 0 && (
                          <span className="text-amber-600">{previewSummary.needsReview} need tag review</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelPreview}
                    className="px-4 py-2 rounded-xl text-sm text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || previewSummary.valid === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-mesa-burgundy text-white rounded-xl text-sm font-medium hover:bg-mesa-burgundy/90 disabled:opacity-50 transition"
                  >
                    {importing ? 'Importing...' : `Import ${previewSummary.valid} Items`}
                  </button>
                </div>
              </div>

              {parseResult.isDetailedFormat && previewSummary.needsReview > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    {previewSummary.needsReview} items are missing required tags (mood, portion, temperature).
                    Click &quot;Edit&quot; to add tags before importing.
                  </p>
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  {parseResult.errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-mesa-charcoal/5 z-10">
                    <tr>
                      <th className="text-left py-3 px-4 text-mesa-charcoal/50 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-mesa-charcoal/50 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-mesa-charcoal/50 font-medium">Price</th>
                      <th className="text-left py-3 px-4 text-mesa-charcoal/50 font-medium">Category</th>
                      {parseResult.isDetailedFormat && (
                        <th className="text-left py-3 px-4 text-mesa-charcoal/50 font-medium">Auto Tags</th>
                      )}
                      <th className="text-right py-3 px-4 text-mesa-charcoal/50 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.slice(0, 50).map((item, i) => {
                      const itemReady = item.isValid && hasRequiredTags(item.editedTags)
                      const needsReview = item.isValid && !hasRequiredTags(item.editedTags)

                      return (
                        <tr
                          key={i}
                          className={`border-t border-mesa-charcoal/5 ${
                            !item.isValid ? 'bg-red-50' : needsReview ? 'bg-amber-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            {item.isValid ? (
                              itemReady ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                              )
                            ) : (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-mesa-charcoal font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-mesa-charcoal/70">
                            {item.isValid ? `€${item.price.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-mesa-charcoal/70">{item.category}</td>
                          {parseResult.isDetailedFormat && (
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {item.editedTags.slice(0, 4).map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-mesa-charcoal/10 text-mesa-charcoal/70">
                                    {TAG_LABELS[tag]}
                                  </span>
                                ))}
                                {item.editedTags.length > 4 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-mesa-charcoal/10 text-mesa-charcoal/50">
                                    +{item.editedTags.length - 4}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-4 text-right">
                            {item.isValid && (
                              <button
                                onClick={() => setEditingPreviewIndex(i)}
                                className="text-xs text-mesa-burgundy hover:underline"
                              >
                                Edit tags
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {previewItems.length > 50 && (
                  <p className="text-center text-sm text-mesa-charcoal/50 py-3">
                    ... and {previewItems.length - 50} more items
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        {!parseResult && (
          <ScrollReveal>
            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-mesa-charcoal mb-4">Import from CSV</h3>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-mesa-burgundy bg-mesa-burgundy/5'
                    : 'border-mesa-charcoal/20 hover:border-mesa-burgundy/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 text-mesa-charcoal/30 mx-auto mb-3" />
                <p className="text-mesa-charcoal font-medium mb-1">
                  Drag & drop a CSV file, or click to browse
                </p>
                <p className="text-sm text-mesa-charcoal/50">
                  Simple format: name, description, price, category
                </p>
                <p className="text-sm text-mesa-charcoal/50">
                  Detailed format: includes flavor profiles for auto-tagging
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={() => downloadDetailedTemplate()}
                  className="flex items-center gap-2 text-sm text-mesa-burgundy hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Download CSV template
                </button>
                <button
                  onClick={() => setShowChefModal(true)}
                  className="flex items-center gap-1 text-sm text-mesa-charcoal/50 hover:text-mesa-charcoal"
                >
                  <HelpCircle className="w-4 h-4" />
                  Why add flavor tags?
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 glass rounded-xl text-sm text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {categories.map((cat) => {
              const iconKey = cat.toLowerCase().replace(/\s+/g, '') as keyof typeof categoryIcons
              const Icon = categoryIcons[iconKey] || categoryIcons.default
              const count = cat === 'all' ? items.length : items.filter(i => i.category === cat).length

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-mesa-burgundy text-white'
                      : 'glass text-mesa-charcoal/70 hover:text-mesa-charcoal'
                  }`}
                >
                  {cat !== 'all' && <Icon className="w-4 h-4" />}
                  {cat === 'all' ? 'All' : cat}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    categoryFilter === cat ? 'bg-white/20' : 'bg-mesa-charcoal/10'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stock Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <span className="text-sm text-mesa-charcoal/50 mr-2">Stock:</span>
          {[
            { value: 'all', label: 'All', icon: null },
            { value: 'available', label: 'Available', icon: CheckCircle2 },
            { value: 'out_today', label: 'Out Today', icon: Clock },
            { value: 'out_indefinitely', label: 'Out Indefinitely', icon: Ban },
          ].map((option) => {
            const count = option.value === 'all'
              ? items.length
              : items.filter(i => i.stock_status === option.value).length
            const Icon = option.icon

            return (
              <button
                key={option.value}
                onClick={() => setStockFilter(option.value as 'all' | StockStatus)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  stockFilter === option.value
                    ? option.value === 'available'
                      ? 'bg-green-100 text-green-700'
                      : option.value === 'out_today'
                        ? 'bg-amber-100 text-amber-700'
                        : option.value === 'out_indefinitely'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-mesa-burgundy text-white'
                    : 'glass text-mesa-charcoal/60 hover:text-mesa-charcoal'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {option.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  stockFilter === option.value ? 'bg-white/30' : 'bg-mesa-charcoal/10'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Menu Items */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-mesa-burgundy/10 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-mesa-burgundy/50" />
            </div>
            <h3 className="text-lg font-semibold text-mesa-charcoal mb-2">No menu items yet</h3>
            <p className="text-mesa-charcoal/50 mb-6">
              Import items from a CSV file or add items manually
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-mesa-burgundy text-white rounded-xl text-sm font-medium hover:bg-mesa-burgundy/90 transition mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Item
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={`glass rounded-2xl overflow-hidden hover-lift group relative ${
                    item.stock_status !== 'available' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-4 h-4 rounded border-white/50 text-mesa-burgundy focus:ring-mesa-burgundy bg-white/80"
                    />
                  </div>

                  {/* Image/gradient area */}
                  <div className="relative h-32 bg-gradient-to-br from-mesa-burgundy/10 to-mesa-terracotta/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {item.type === 'drink' ? (
                        <Wine className="w-10 h-10 text-mesa-burgundy/20" />
                      ) : (
                        <Utensils className="w-10 h-10 text-mesa-burgundy/20" />
                      )}
                    </div>

                    {/* Featured badge */}
                    {item.is_push && (
                      <div className="absolute top-3 left-10 flex items-center gap-1 px-2 py-1 bg-mesa-burgundy text-white text-xs font-medium rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                    )}

                    {/* Stock status badge */}
                    {item.stock_status === 'out_today' && (
                      <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Out Today
                      </div>
                    )}
                    {item.stock_status === 'out_indefinitely' && (
                      <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        <Ban className="w-3 h-3" />
                        Out Indef.
                      </div>
                    )}

                    {/* Type badge */}
                    <div className={`absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'drink' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.type === 'drink' ? <Wine className="w-3 h-3" /> : <Utensils className="w-3 h-3" />}
                      {item.type === 'drink' ? 'Drink' : 'Food'}
                    </div>

                    {/* Actions menu */}
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="p-2 rounded-xl bg-white/80 backdrop-blur-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute top-full right-0 mt-2 w-40 glass rounded-xl shadow-xl overflow-hidden z-20"
                            >
                              <button
                                onClick={() => { setEditingItem(item); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 transition"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit Tags
                              </button>
                              <button
                                onClick={() => { togglePush(item.id); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 transition"
                              >
                                <TrendingUp className="w-4 h-4" />
                                {item.is_push ? 'Remove Push' : 'Push Item'}
                              </button>
                              <div className="border-t border-mesa-charcoal/5 my-1" />
                              <div className="px-4 py-1">
                                <span className="text-xs text-mesa-charcoal/40">Stock Status</span>
                              </div>
                              <button
                                onClick={() => { setStockStatus(item.id, 'available'); setOpenMenuId(null); }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition ${
                                  item.stock_status === 'available' ? 'text-green-600 bg-green-50' : 'text-mesa-charcoal/70 hover:bg-mesa-charcoal/5'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Available
                              </button>
                              <button
                                onClick={() => { setStockStatus(item.id, 'out_today'); setOpenMenuId(null); }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition ${
                                  item.stock_status === 'out_today' ? 'text-amber-600 bg-amber-50' : 'text-mesa-charcoal/70 hover:bg-mesa-charcoal/5'
                                }`}
                              >
                                <Clock className="w-4 h-4" />
                                Out Today
                              </button>
                              <button
                                onClick={() => { setStockStatus(item.id, 'out_indefinitely'); setOpenMenuId(null); }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition ${
                                  item.stock_status === 'out_indefinitely' ? 'text-red-600 bg-red-50' : 'text-mesa-charcoal/70 hover:bg-mesa-charcoal/5'
                                }`}
                              >
                                <Ban className="w-4 h-4" />
                                Out Indefinitely
                              </button>
                              <div className="border-t border-mesa-charcoal/5 my-1" />
                              <button
                                onClick={() => { deleteItem(item.id); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-mesa-charcoal line-clamp-1">{item.name}</h3>
                        {!hasRequiredTags(item.tags) && (
                          <span title="Missing required tags">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-mesa-burgundy whitespace-nowrap">
                        €{item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-sm text-mesa-charcoal/50 line-clamp-2 mb-3">
                      {item.description || 'No description'}
                    </p>

                    {/* Tags */}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex flex-wrap gap-1.5 cursor-pointer group/tags w-full text-left"
                    >
                      {getDisplayTags(item.tags).length > 0 ? (
                        <>
                          {getDisplayTags(item.tags).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-mesa-charcoal/5 text-mesa-charcoal/70 group-hover/tags:bg-mesa-burgundy/10 group-hover/tags:text-mesa-burgundy transition"
                            >
                              {TAG_LABELS[tag]}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-mesa-charcoal/40">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-mesa-charcoal/40 hover:text-mesa-burgundy">
                          + Add tags
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Add Item Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-2xl"
              >
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-mesa-charcoal/5 bg-white/80 backdrop-blur-sm rounded-t-2xl">
                  <h2 className="text-xl font-serif text-mesa-charcoal">Add New Item</h2>
                  <button
                    onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
                    className="p-2 rounded-xl hover:bg-mesa-charcoal/5 transition"
                  >
                    <X className="w-5 h-5 text-mesa-charcoal/50" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-mesa-charcoal mb-2">Name *</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., Classic Burger"
                      className="w-full px-4 py-3 rounded-xl border border-mesa-charcoal/10 text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-mesa-charcoal mb-2">Description</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Describe the item..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-mesa-charcoal/10 text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-mesa-charcoal mb-2">Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, type: 'food' })}
                        className={`py-3 px-4 rounded-xl border-2 transition flex items-center justify-center gap-2 text-sm font-medium ${
                          newItem.type === 'food'
                            ? 'border-mesa-burgundy bg-mesa-burgundy/5 text-mesa-burgundy'
                            : 'border-mesa-charcoal/10 text-mesa-charcoal/60 hover:border-mesa-charcoal/20'
                        }`}
                      >
                        <Utensils className="w-4 h-4" /> Food
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, type: 'drink' })}
                        className={`py-3 px-4 rounded-xl border-2 transition flex items-center justify-center gap-2 text-sm font-medium ${
                          newItem.type === 'drink'
                            ? 'border-mesa-burgundy bg-mesa-burgundy/5 text-mesa-burgundy'
                            : 'border-mesa-charcoal/10 text-mesa-charcoal/60 hover:border-mesa-charcoal/20'
                        }`}
                      >
                        <Wine className="w-4 h-4" /> Drink
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-mesa-charcoal mb-2">Price *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mesa-charcoal/50">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-mesa-charcoal/10 text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-mesa-charcoal mb-2">Category</label>
                      <input
                        type="text"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        placeholder="e.g., Mains"
                        className="w-full px-4 py-3 rounded-xl border border-mesa-charcoal/10 text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-mesa-charcoal mb-2">Tags</label>
                    <button
                      onClick={() => setShowNewItemTagEditor(true)}
                      className="w-full px-4 py-3 rounded-xl border border-mesa-charcoal/10 text-left hover:border-mesa-burgundy/30 transition"
                    >
                      {newItemTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {newItemTags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-mesa-burgundy/10 text-mesa-burgundy">
                              {TAG_LABELS[tag]}
                            </span>
                          ))}
                          {newItemTags.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-mesa-charcoal/10 text-mesa-charcoal/50">
                              +{newItemTags.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-mesa-charcoal/40">Click to add tags...</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-6 pt-0">
                  <button
                    onClick={() => { setShowAddModal(false); setNewItem(defaultNewItem); setNewItemTags([]); }}
                    className="flex-1 py-3 rounded-xl border border-mesa-charcoal/10 text-mesa-charcoal font-medium hover:bg-mesa-charcoal/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={addingItem || !newItem.name.trim() || !newItem.price}
                    className="flex-1 py-3 rounded-xl bg-mesa-burgundy text-white font-medium hover:bg-mesa-burgundy/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {addingItem ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Add Item
                      </>
                    )}
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

        {/* Chef Modal */}
        <AnimatePresence>
          {showChefModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowChefModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg glass rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-mesa-burgundy/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-7 h-7 text-mesa-burgundy" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-mesa-charcoal">Why flavor tags matter</h2>
                    <p className="text-mesa-charcoal/50 text-sm mt-1">From our culinary team</p>
                  </div>
                </div>

                <div className="space-y-4 text-mesa-charcoal/70">
                  <p>
                    Flavor tags help us understand the <strong className="text-mesa-charcoal">soul of each dish</strong> so we can match guests with exactly what they&apos;re craving.
                  </p>

                  <div className="glass-warm rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-mesa-burgundy flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-mesa-charcoal">Better recommendations</p>
                        <p className="text-sm">Match dishes to guest mood, dietary needs, and flavor preferences</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Wine className="w-5 h-5 text-mesa-burgundy flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-mesa-charcoal">Smart pairings</p>
                        <p className="text-sm">Suggest complementary drinks and sides automatically</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-mesa-burgundy flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-mesa-charcoal">Real insights</p>
                        <p className="text-sm">Discover what flavors and moods drive orders at your venue</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm">
                    The more detailed your tags, the better we can serve your guests. Most restaurants see a <strong className="text-mesa-charcoal">15-20% increase</strong> in add-on orders after adding flavor profiles.
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowChefModal(false)}
                    className="px-6 py-2.5 bg-mesa-burgundy text-white rounded-xl font-medium hover:bg-mesa-burgundy/90 transition"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

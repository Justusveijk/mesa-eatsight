'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Search, Star, Plus, Pencil, Trash2, AlertCircle, Check, X, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TagEditor } from '@/components/dashboard/TagEditor'
import { MenuTag, TAG_LABELS } from '@/lib/types/taxonomy'
import { parseCSV, ParsedItem, ParseResult, downloadSimpleTemplate, downloadDetailedTemplate } from '@/lib/menu-import'
import { createClient } from '@/lib/supabase/client'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  popularity_score: number
  is_push: boolean
  is_out_of_stock: boolean
  tags: MenuTag[]
}

interface MenuData {
  id: string
  status: string
  published_at: string | null
}

// Extended parsed item with editable tags
interface PreviewItem extends ParsedItem {
  editedTags: MenuTag[]
}

// New item form data
interface NewItemForm {
  name: string
  description: string
  price: string
  category: string
}

const defaultNewItem: NewItemForm = {
  name: '',
  description: '',
  price: '',
  category: '',
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // CSV Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [importing, setImporting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const templateMenuRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Close template menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchMenuData = useCallback(async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's venue
    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!operatorUser?.venue_id) return

    // Get the menu for this venue
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

    // Get menu items with tags
    const { data: itemsData } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        category,
        popularity_score,
        is_push,
        is_out_of_stock,
        item_tags (tag)
      `)
      .eq('menu_id', menuData.id)
      .order('category')
      .order('name')

    if (itemsData) {
      const transformedItems: MenuItem[] = itemsData.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        popularity_score: item.popularity_score || 0,
        is_push: item.is_push || false,
        is_out_of_stock: item.is_out_of_stock || false,
        tags: (item.item_tags as { tag: string }[])?.map((t) => t.tag as MenuTag) || [],
      }))
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
    return matchesSearch && matchesCategory
  })

  const handleSaveTags = async (tags: MenuTag[]) => {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })

      if (!response.ok) {
        throw new Error('Failed to save tags')
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, tags } : item
        )
      )
      setEditingItem(null)
      showToast('Tags saved successfully', 'success')
    } catch (error) {
      console.error('Save tags error:', error)
      showToast('Failed to save tags', 'error')
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

  // Add new item handler
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
            tags: newItemTags,
          }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item')
      }

      showToast('Item added successfully', 'success')
      setShowAddModal(false)
      setNewItem(defaultNewItem)
      setNewItemTags([])
      fetchMenuData()
    } catch (error) {
      console.error('Add item error:', error)
      showToast('Failed to add item', 'error')
    } finally {
      setAddingItem(false)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return

    setDeletingBulk(true)

    try {
      const supabase = createClient()

      // First delete tags for all selected items
      const { error: tagError } = await supabase
        .from('item_tags')
        .delete()
        .in('item_id', selectedItems)

      if (tagError) {
        console.error('Bulk tag delete error:', tagError)
      }

      // Then delete the items
      const { error: itemError } = await supabase
        .from('menu_items')
        .delete()
        .in('id', selectedItems)

      if (itemError) {
        console.error('Bulk item delete error:', itemError)
        showToast('Failed to delete items', 'error')
      } else {
        showToast(`Deleted ${selectedItems.length} items`, 'success')
        setSelectedItems([])
        fetchMenuData()
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      showToast('Failed to delete items', 'error')
    } finally {
      setDeletingBulk(false)
    }
  }

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Select all items
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map((i) => i.id))
    }
  }

  const toggleAvailable = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newValue = !item.is_out_of_stock

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_out_of_stock: newValue } : i))
    )

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_out_of_stock: newValue }),
      })

      if (!response.ok) {
        // Revert on error
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_out_of_stock: !newValue } : i))
        )
        showToast('Failed to update availability', 'error')
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_out_of_stock: !newValue } : i))
      )
      showToast('Failed to update availability', 'error')
    }
  }

  const togglePush = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newValue = !item.is_push

    // Optimistic update
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

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedItems((prev) => prev.filter((i) => i !== id))

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Revert on error
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
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async (file: File) => {
    const result = await parseCSV(file)
    setParseResult(result)
    // Initialize preview items with auto-generated tags
    setPreviewItems(result.items.map(item => ({
      ...item,
      editedTags: item.autoTags,
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
            tags: item.editedTags,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import')
      }

      showToast(`Imported ${data.count} items successfully`, 'success')
      setParseResult(null)
      setPreviewItems([])
      fetchMenuData()
    } catch (error) {
      console.error('Import error:', error)
      showToast('Failed to import items', 'error')
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
      console.error('Publish error:', error)
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

  // Calculate preview summary
  const previewSummary = {
    total: previewItems.length,
    valid: previewItems.filter(i => i.isValid).length,
    ready: previewItems.filter(i => i.isValid && hasRequiredTags(i.editedTags)).length,
    needsReview: previewItems.filter(i => i.isValid && !hasRequiredTags(i.editedTags)).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
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
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Menu Management</h1>
          <p className="text-[#1a1a1a]/50">
            {items.length} items
            {menu?.status === 'published' && (
              <span className="ml-2 text-green-600">
                (Published)
              </span>
            )}
            {menu?.status === 'draft' && (
              <span className="ml-2 text-amber-600">
                (Draft)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePublish}
            disabled={publishing || items.length === 0}
            className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
          >
            {publishing ? 'Publishing...' : 'Publish Menu'}
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-[#1e3a5f] hover:bg-[#0f2440] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-[#1a1a1a] font-medium">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deletingBulk}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deletingBulk ? 'Deleting...' : 'Delete selected'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItems([])}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* CSV Preview */}
      {parseResult && previewItems.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#1a1a1a]">Preview Import</h3>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-[#1a1a1a]/50">
                  {previewSummary.valid} of {previewSummary.total} items valid
                </span>
                {parseResult.isDetailedFormat && (
                  <>
                    <span className="text-green-600">
                      {previewSummary.ready} ready
                    </span>
                    {previewSummary.needsReview > 0 && (
                      <span className="text-amber-600">
                        {previewSummary.needsReview} need tag review
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleCancelPreview}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || previewSummary.valid === 0}
                className="bg-[#1e3a5f] hover:bg-[#0f2440] text-white"
              >
                {importing ? 'Importing...' : `Import ${previewSummary.valid} Items`}
              </Button>
            </div>
          </div>

          {/* Import confirmation message */}
          {parseResult.isDetailedFormat && previewSummary.needsReview > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                {previewSummary.needsReview} items are missing required tags (mood, portion, temperature).
                Click &quot;Edit&quot; to add tags before importing.
              </p>
            </div>
          )}

          {parseResult.errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {parseResult.errors.map((error, i) => (
                <p key={i} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-[#1a1a1a]/50">Status</th>
                  <th className="text-left py-2 px-3 text-[#1a1a1a]/50">Name</th>
                  <th className="text-left py-2 px-3 text-[#1a1a1a]/50">Price</th>
                  <th className="text-left py-2 px-3 text-[#1a1a1a]/50">Category</th>
                  {parseResult.isDetailedFormat && (
                    <th className="text-left py-2 px-3 text-[#1a1a1a]/50">Auto Tags</th>
                  )}
                  <th className="text-right py-2 px-3 text-[#1a1a1a]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.slice(0, 50).map((item, i) => {
                  const itemReady = item.isValid && hasRequiredTags(item.editedTags)
                  const needsReview = item.isValid && !hasRequiredTags(item.editedTags)

                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${
                        !item.isValid
                          ? 'bg-red-50'
                          : needsReview
                            ? 'bg-amber-50'
                            : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        {item.isValid ? (
                          itemReady ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <span title="Missing required tags">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            </span>
                          )
                        ) : (
                          <span title={item.errors.join(', ')}>
                            <X className="w-4 h-4 text-red-600" />
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#1a1a1a] font-medium">{item.name}</td>
                      <td className="py-2 px-3 text-[#1a1a1a]/70">
                        {item.isValid ? `€${item.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-[#1a1a1a]/70">{item.category}</td>
                      {parseResult.isDetailedFormat && (
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {item.editedTags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/70"
                              >
                                {TAG_LABELS[tag]}
                              </span>
                            ))}
                            {item.editedTags.length > 4 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/70">
                                +{item.editedTags.length - 4}
                              </span>
                            )}
                            {item.editedTags.length === 0 && (
                              <span className="text-xs text-[#1a1a1a]/40">No tags</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-2 px-3 text-right">
                        {item.isValid && (
                          <button
                            onClick={() => setEditingPreviewIndex(i)}
                            className="text-xs text-[#1e3a5f] hover:underline"
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
              <p className="text-center text-sm text-[#1a1a1a]/50 py-2">
                ... and {previewItems.length - 50} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!parseResult && (
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm overflow-visible">
          <h3 className="font-semibold text-[#1a1a1a] mb-4">Import from CSV</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                : 'border-gray-300 hover:border-[#1e3a5f]'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 text-[#1a1a1a]/40 mx-auto mb-3" />
            <p className="text-[#1a1a1a] mb-1">
              Drag & drop a CSV file, or click to browse
            </p>
            <p className="text-sm text-[#1a1a1a]/50">
              Simple format: name, description, price, category
            </p>
            <p className="text-sm text-[#1a1a1a]/50">
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
          <div className="relative mt-3 z-50" ref={templateMenuRef}>
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-2 text-sm text-[#1e3a5f] hover:underline"
            >
              <FileText className="w-4 h-4" />
              Download template
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplateMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] py-2 min-w-[240px]">
                <button
                  onClick={() => {
                    downloadSimpleTemplate()
                    setShowTemplateMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">Simple template</div>
                  <div className="text-xs text-[#1a1a1a]/50">name, description, price, category</div>
                </button>
                <button
                  onClick={() => {
                    downloadDetailedTemplate()
                    setShowTemplateMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">Detailed template</div>
                  <div className="text-xs text-[#1a1a1a]/50">With flavor profiles for auto-tagging</div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] placeholder-[#1a1a1a]/40 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1e3a5f]"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <Upload className="w-12 h-12 text-[#1a1a1a]/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">No menu items yet</h3>
          <p className="text-[#1a1a1a]/50 mb-4">
            Import items from a CSV file or add items manually
          </p>
          <Button onClick={() => setShowAddModal(true)} className="bg-[#1e3a5f] hover:bg-[#0f2440] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50 w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                    />
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Name</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Price</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Category</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Tags</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Status</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-[#1a1a1a]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1a1a1a]">{item.name}</span>
                        {!hasRequiredTags(item.tags) && (
                          <span title="Missing required tags">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#1a1a1a]/70">€{item.price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-[#1a1a1a]/70">{item.category}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="flex flex-wrap gap-1 cursor-pointer group"
                      >
                        {getDisplayTags(item.tags).length > 0 ? (
                          <>
                            {getDisplayTags(item.tags).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/70 group-hover:bg-[#1e3a5f]/10 group-hover:text-[#1e3a5f] transition-colors"
                              >
                                {TAG_LABELS[tag]}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/50">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-[#1a1a1a]/40 hover:text-[#1e3a5f]">
                            + Add tags
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAvailable(item.id)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            item.is_out_of_stock ? 'bg-gray-300' : 'bg-green-500'
                          }`}
                          title={item.is_out_of_stock ? 'Out of stock' : 'Available'}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              item.is_out_of_stock ? 'left-0.5' : 'left-5'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => togglePush(item.id)}
                          className={`p-1 rounded transition-colors ${
                            item.is_push
                              ? 'text-amber-500'
                              : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'
                          }`}
                          title={item.is_push ? 'Featured item' : 'Feature this item'}
                        >
                          <Star className="w-4 h-4" fill={item.is_push ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#1a1a1a]/50 hover:text-[#1a1a1a]"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-[#1a1a1a]/50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1a1a1a]">Add New Item</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewItem(defaultNewItem)
                  setNewItemTags([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#1a1a1a]/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Classic Burger"
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe the item..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g., Mains"
                    className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">
                  Tags
                </label>
                <button
                  onClick={() => setShowNewItemTagEditor(true)}
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-left hover:border-[#1e3a5f] transition-colors"
                >
                  {newItemTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {newItemTags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f]"
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                      {newItemTags.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/50">
                          +{newItemTags.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#1a1a1a]/40">Click to add tags...</span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  setNewItem(defaultNewItem)
                  setNewItemTags([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={addingItem || !newItem.name.trim() || !newItem.price}
                className="bg-[#1e3a5f] hover:bg-[#0f2440] text-white"
              >
                {addingItem ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Editor Modal for existing items */}
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

      {/* Tag Editor Modal for preview items */}
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

      {/* Tag Editor Modal for new item */}
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

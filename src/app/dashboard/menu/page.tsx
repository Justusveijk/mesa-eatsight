'use client'

import { useState, useRef } from 'react'
import { Upload, Search, Star, Plus, Pencil, Trash2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { TagEditor } from '@/components/dashboard/TagEditor'
import { MenuItem, MenuTag, TAG_LABELS } from '@/lib/types/taxonomy'
import { mockMenuItems } from '@/lib/data/mock-menu'

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(mockMenuItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))]

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSaveTags = (tags: MenuTag[]) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, tags } : item
        )
      )
      setEditingItem(null)
    }
  }

  const toggleAvailable = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isOutOfStock: !item.isOutOfStock } : item
      )
    )
  }

  const togglePush = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPush: !item.isPush } : item
      )
    )
  }

  const deleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      alert(`Would import: ${file.name}`)
    }
  }

  const getDisplayTags = (tags: MenuTag[]) => {
    return tags
      .filter((t) => !t.startsWith('price_'))
      .slice(0, 3)
  }

  const hasRequiredTags = (item: MenuItem) => {
    const hasMood = item.tags.some((t) => t.startsWith('mood_'))
    const hasPortion = item.tags.some((t) => t.startsWith('portion_'))
    const hasTemp = item.tags.some((t) => t.startsWith('temp_'))
    return hasMood && hasPortion && hasTemp
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Menu Management</h1>
          <p className="text-text-muted">Manage your menu items and tags</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="signal-outline">
            Publish Menu <span className="ml-2 text-xs bg-ocean-600 px-2 py-0.5 rounded">v3</span>
          </Button>
          <Button variant="signal">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <GlassPanel className="p-6 mb-8">
        <h3 className="font-semibold text-text-primary mb-4">Import from CSV</h3>
        <div
          className="border-2 border-dashed border-line rounded-xl p-8 text-center hover:border-signal transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-primary mb-1">
            Drag & drop a CSV file, or click to browse
          </p>
          <p className="text-sm text-text-muted">
            Expected columns: name, description, price, category
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <button className="text-sm text-signal hover:underline mt-3">
          Download template
        </button>
      </GlassPanel>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-ocean-700 border border-line text-text-primary placeholder-text-muted/50 text-sm focus:outline-none focus:border-signal"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-ocean-700 border border-line text-text-primary text-sm focus:outline-none focus:border-signal"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <GlassPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-4 px-6 text-sm font-medium text-text-muted">
                  Name
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">
                  Price
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">
                  Category
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">
                  Tags
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">
                  Status
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-line/50 hover:bg-ocean-700/30"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{item.name}</span>
                      {!hasRequiredTags(item) && (
                        <AlertCircle className="w-4 h-4 text-yellow-400" title="Missing required tags" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-text-muted">€{item.price}</td>
                  <td className="py-4 px-4 text-text-muted">{item.category}</td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex flex-wrap gap-1 cursor-pointer group"
                    >
                      {getDisplayTags(item.tags).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-ocean-600/50 text-text-muted group-hover:bg-signal/20 group-hover:text-signal transition-colors"
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ocean-600/50 text-text-muted">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAvailable(item.id)}
                        className={`
                          w-10 h-5 rounded-full transition-colors relative
                          ${item.isOutOfStock ? 'bg-ocean-600' : 'bg-green-500'}
                        `}
                        title={item.isOutOfStock ? 'Out of stock' : 'Available'}
                      >
                        <span
                          className={`
                            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                            ${item.isOutOfStock ? 'left-0.5' : 'left-5'}
                          `}
                        />
                      </button>
                      <button
                        onClick={() => togglePush(item.id)}
                        className={`
                          p-1 rounded transition-colors
                          ${item.isPush ? 'text-yellow-400' : 'text-text-muted hover:text-text-primary'}
                        `}
                        title={item.isPush ? 'Featured item' : 'Feature this item'}
                      >
                        <Star className="w-4 h-4" fill={item.isPush ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 hover:bg-ocean-700 rounded-lg transition-colors text-text-muted hover:text-text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-text-muted hover:text-red-400"
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
      </GlassPanel>

      {/* Tag Editor Modal */}
      {editingItem && (
        <TagEditor
          item={editingItem}
          onSave={handleSaveTags}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

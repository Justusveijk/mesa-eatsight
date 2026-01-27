'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { MenuItem, MenuTag, TAG_CATEGORIES, TAG_LABELS } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'

interface TagEditorProps {
  item: MenuItem
  onSave: (tags: MenuTag[]) => void
  onClose: () => void
}

export function TagEditor({ item, onSave, onClose }: TagEditorProps) {
  const [selectedTags, setSelectedTags] = useState<MenuTag[]>(item.tags)

  useEffect(() => {
    setSelectedTags(item.tags)
  }, [item])

  const toggleTag = (tag: MenuTag, category: keyof typeof TAG_CATEGORIES) => {
    const config = TAG_CATEGORIES[category]
    const categoryTags = config.tags as readonly MenuTag[]

    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      }

      const currentCategoryCount = prev.filter((t) =>
        categoryTags.includes(t as never)
      ).length

      if (currentCategoryCount >= config.max) {
        if (config.max === 1) {
          return [...prev.filter((t) => !categoryTags.includes(t as never)), tag]
        }
        return prev
      }

      return [...prev, tag]
    })
  }

  const getCategoryTags = (category: keyof typeof TAG_CATEGORIES) => {
    const categoryTags = TAG_CATEGORIES[category].tags as readonly MenuTag[]
    return selectedTags.filter((t) => categoryTags.includes(t as never))
  }

  const getValidationErrors = (): string[] => {
    const errors: string[] = []
    const categories = Object.entries(TAG_CATEGORIES) as [
      keyof typeof TAG_CATEGORIES,
      (typeof TAG_CATEGORIES)[keyof typeof TAG_CATEGORIES]
    ][]

    for (const [key, config] of categories) {
      if (config.required) {
        const count = getCategoryTags(key).length
        if (count === 0) {
          errors.push(`${config.label} is required`)
        }
      }
    }

    return errors
  }

  const errors = getValidationErrors()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Edit Tags</h2>
            <p className="text-sm text-text-muted">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ocean-700 rounded-lg transition-colors text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 dark-scrollbar">
          {(
            Object.entries(TAG_CATEGORIES) as [
              keyof typeof TAG_CATEGORIES,
              (typeof TAG_CATEGORIES)[keyof typeof TAG_CATEGORIES]
            ][]
          ).map(([categoryKey, config]) => (
            <div key={categoryKey}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-text-primary">{config.label}</h3>
                {config.required && (
                  <span className="text-xs text-signal">Required</span>
                )}
                <span className="text-xs text-text-muted">
                  (select {config.max === 1 ? '1' : `up to ${config.max}`})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag as MenuTag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag as MenuTag, categoryKey)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${
                          isSelected
                            ? 'bg-signal text-white'
                            : 'bg-ocean-700 text-text-muted hover:bg-ocean-600 hover:text-text-primary'
                        }
                      `}
                    >
                      {TAG_LABELS[tag as MenuTag]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="px-6 py-3 bg-signal/10 border-t border-signal/20">
            <p className="text-sm text-signal">
              Missing required tags: {errors.join(', ')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          <Button variant="signal-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="signal"
            onClick={() => onSave(selectedTags)}
            disabled={errors.length > 0}
          >
            Save Tags
          </Button>
        </div>
      </div>
    </div>
  )
}

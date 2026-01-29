'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Upload,
  Check,
  FileSpreadsheet,
  Tag,
  Wine,
  Rocket,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TagEditor } from '@/components/dashboard/TagEditor'
import { MenuItem, MenuTag, TAG_LABELS } from '@/lib/types/taxonomy'
import { QRCode } from 'react-qrcode-logo'

type Step = 1 | 2 | 3 | 4 | 5

const steps = [
  { id: 1, label: 'Download Templates', icon: Download },
  { id: 2, label: 'Upload Menu', icon: Upload },
  { id: 3, label: 'Tag & Prioritize', icon: Tag },
  { id: 4, label: 'Upsell Setup', icon: Wine },
  { id: 5, label: 'Publish & Go Live', icon: Rocket },
]

// Sample imported items for demo
const sampleMenuItems: MenuItem[] = [
  { id: '1', name: 'Classic Cheeseburger', price: 16, category: 'Mains', tags: ['mood_comfort', 'flavor_umami', 'portion_standard', 'temp_hot', 'protein_red_meat'] },
  { id: '2', name: 'Caesar Salad', price: 14, category: 'Starters', tags: ['mood_light', 'flavor_tangy', 'portion_standard', 'temp_chilled'] },
  { id: '3', name: 'Margherita Pizza', price: 18, category: 'Mains', tags: ['mood_comfort', 'flavor_umami', 'portion_standard', 'temp_hot', 'diet_vegetarian'] },
  { id: '4', name: 'Spicy Wings', price: 12, category: 'Starters', tags: [] }, // Needs tagging
  { id: '5', name: 'Chocolate Cake', price: 9, category: 'Desserts', tags: ['mood_treat', 'flavor_sweet', 'portion_bite', 'temp_room'] },
  { id: '6', name: 'Fish & Chips', price: 19, category: 'Mains', tags: [] }, // Needs tagging
]

export default function OnboardingSetupPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [upsellEnabled, setUpsellEnabled] = useState(false)
  const [upsellMode, setUpsellMode] = useState<'auto' | 'manual'>('auto')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  const venueSlug = 'bella-taverna' // Would come from session

  const completeStep = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
    }
    if (step < 5) {
      setCurrentStep((step + 1) as Step)
    }
  }

  const itemsNeedingTags = menuItems.filter((item) => {
    const hasMood = item.tags.some((t) => t.startsWith('mood_'))
    const hasPortion = item.tags.some((t) => t.startsWith('portion_'))
    const hasTemp = item.tags.some((t) => t.startsWith('temp_'))
    return !hasMood || !hasPortion || !hasTemp
  })

  const tagCoverage = menuItems.length > 0
    ? Math.round(((menuItems.length - itemsNeedingTags.length) / menuItems.length) * 100)
    : 0

  const handleFileUpload = () => {
    // Simulate file upload
    setMenuItems(sampleMenuItems)
    completeStep(2)
  }

  const handleSaveTags = (tags: MenuTag[]) => {
    if (editingItem) {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, tags } : item
        )
      )
      setEditingItem(null)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsPublishing(false)
    setIsPublished(true)
    completeStep(5)
  }

  const downloadTemplate = (type: 'food' | 'drinks') => {
    // In production, this would download actual CSV templates
    const link = document.createElement('a')
    link.href = `data:text/csv;charset=utf-8,name,description,price,category\nExample Item,A delicious dish,12.99,Mains`
    link.download = `${type}-menu-template.csv`
    link.click()
  }

  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-[#1a1a1a] font-semibold">Eatsight</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <p className="text-[#1a1a1a]/50 text-sm mb-2">
            {completedSteps.length} of 5 complete
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#722F37]"
              initial={{ width: 0 }}
              animate={{ width: `${(completedSteps.length / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <nav className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = currentStep === step.id

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id as Step)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  isCurrent
                    ? 'bg-[#722F37]/10 text-[#1a1a1a]'
                    : isCompleted
                    ? 'text-[#1a1a1a] hover:bg-gray-100'
                    : 'text-[#1a1a1a]/50 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-[#722F37] text-white'
                      : isCurrent
                      ? 'bg-[#722F37]/20 text-[#722F37]'
                      : 'bg-gray-200 text-[#1a1a1a]/50'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Download Templates */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                  Download menu templates
                </h1>
                <p className="text-[#1a1a1a]/50 mb-8">
                  Start with our CSV templates to format your menu data correctly.
                </p>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-[#FDFBF7] rounded-xl">
                      <FileSpreadsheet className="w-10 h-10 text-[#722F37] mb-4" />
                      <h3 className="font-semibold text-[#1a1a1a] mb-2">
                        Food menu template
                      </h3>
                      <p className="text-sm text-[#1a1a1a]/50 mb-4">
                        For starters, mains, desserts, and sides.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate('food')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>

                    <div className="p-6 bg-[#FDFBF7] rounded-xl">
                      <Wine className="w-10 h-10 text-[#722F37] mb-4" />
                      <h3 className="font-semibold text-[#1a1a1a] mb-2">
                        Drinks menu template
                      </h3>
                      <p className="text-sm text-[#1a1a1a]/50 mb-4">
                        For cocktails, wines, beers, and soft drinks.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate('drinks')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => completeStep(1)} className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                    I have my files ready
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload Menu */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                  Upload your menu
                </h1>
                <p className="text-[#1a1a1a]/50 mb-8">
                  Import your menu items from CSV files.
                </p>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#722F37] transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-[#1a1a1a]/40 mx-auto mb-4" />
                    <p className="text-[#1a1a1a] font-medium mb-2">
                      Drop your CSV here or click to browse
                    </p>
                    <p className="text-sm text-[#1a1a1a]/50">
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

                  {menuItems.length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">{menuItems.length} items imported</span>
                      </div>
                    </div>
                  )}
                </div>

                {menuItems.length > 0 && (
                  <div className="flex justify-end">
                    <Button onClick={() => completeStep(2)} className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                      Continue to tagging
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Tag & Prioritize */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                  Tag your menu items
                </h1>
                <p className="text-[#1a1a1a]/50 mb-8">
                  Add tags to enable smart recommendations.
                </p>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[#1a1a1a]/50 text-sm">Total items</p>
                    <p className="text-2xl font-bold text-[#1a1a1a]">{menuItems.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[#1a1a1a]/50 text-sm">Needs tagging</p>
                    <p className="text-2xl font-bold text-amber-600">{itemsNeedingTags.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[#1a1a1a]/50 text-sm">Tag coverage</p>
                    <p className="text-2xl font-bold text-[#722F37]">{tagCoverage}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-6 text-sm font-medium text-[#1a1a1a]/50">Name</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Category</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Tags</th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-[#1a1a1a]/50">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => {
                        const needsTags = itemsNeedingTags.includes(item)
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-4 px-6 text-[#1a1a1a]">{item.name}</td>
                            <td className="py-4 px-4 text-[#1a1a1a]/70">{item.category}</td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="flex flex-wrap gap-1 group"
                              >
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/70 group-hover:bg-[#722F37]/10 group-hover:text-[#722F37] transition-colors"
                                  >
                                    {TAG_LABELS[tag]}
                                  </span>
                                ))}
                                {item.tags.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#1a1a1a]/50">
                                    +{item.tags.length - 3}
                                  </span>
                                )}
                                {item.tags.length === 0 && (
                                  <span className="text-xs text-[#1a1a1a]/40 hover:text-[#722F37]">Click to add tags</span>
                                )}
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              {needsTags ? (
                                <span className="flex items-center gap-1 text-amber-600 text-sm">
                                  <AlertCircle className="w-4 h-4" />
                                  Needs tags
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <Check className="w-4 h-4" />
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => completeStep(3)} className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Upsell Setup */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                  Upsell setup (optional)
                </h1>
                <p className="text-[#1a1a1a]/50 mb-8">
                  Suggest drinks alongside food recommendations.
                </p>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-[#1a1a1a]">Enable drink upsells</h3>
                      <p className="text-sm text-[#1a1a1a]/50">
                        Show 1-2 drink suggestions after food recommendations
                      </p>
                    </div>
                    <button
                      onClick={() => setUpsellEnabled(!upsellEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        upsellEnabled ? 'bg-[#722F37]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          upsellEnabled ? 'left-6' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {upsellEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1a1a1a]/50 mb-3">
                          Upsell mode
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setUpsellMode('auto')}
                            className={`p-4 rounded-xl border text-left transition-colors ${
                              upsellMode === 'auto'
                                ? 'border-[#722F37] bg-[#722F37]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <h4 className="font-medium text-[#1a1a1a] mb-1">Auto</h4>
                            <p className="text-sm text-[#1a1a1a]/50">
                              We&apos;ll suggest drinks that match guest preferences
                            </p>
                          </button>
                          <button
                            onClick={() => setUpsellMode('manual')}
                            className={`p-4 rounded-xl border text-left transition-colors ${
                              upsellMode === 'manual'
                                ? 'border-[#722F37] bg-[#722F37]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <h4 className="font-medium text-[#1a1a1a] mb-1">Manual</h4>
                            <p className="text-sm text-[#1a1a1a]/50">
                              Choose specific drinks to recommend
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => completeStep(4)} className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                    {upsellEnabled ? 'Save & continue' : 'Skip for now'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Publish */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {!isPublished ? (
                  <>
                    <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                      Ready to go live!
                    </h1>
                    <p className="text-[#1a1a1a]/50 mb-8">
                      Review your setup and publish your menu.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-[#1a1a1a] mb-4">Summary</h3>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-[#1a1a1a]/50">Venue</span>
                            <span className="text-[#1a1a1a]">Bella Taverna</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-[#1a1a1a]/50">Menu items</span>
                            <span className="text-[#1a1a1a]">{menuItems.length}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-[#1a1a1a]/50">Tag coverage</span>
                            <span className="text-[#722F37]">{tagCoverage}%</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-[#1a1a1a]/50">Upsells</span>
                            <span className="text-[#1a1a1a]">
                              {upsellEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                            <QRCode
                              value={`https://eatsight.ai/v/${venueSlug}`}
                              size={160}
                              fgColor="#722F37"
                              bgColor="#ffffff"
                              ecLevel="M"
                              quietZone={0}
                            />
                          </div>
                          <p className="text-xs text-[#1a1a1a]/50 text-center">
                            eatsight.ai/v/{venueSlug}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="bg-[#722F37] hover:bg-[#5a252c] text-white"
                      >
                        {isPublishing ? (
                          <>Publishing...</>
                        ) : (
                          <>
                            <Rocket className="w-5 h-5 mr-2" />
                            Publish menu
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 bg-[#722F37] rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">
                      Your menu is live!
                    </h1>
                    <p className="text-[#1a1a1a]/50 mb-8">
                      Guests can now scan your QR code to get personalized recommendations.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 inline-block mb-8 shadow-sm">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                        <QRCode
                          value={`https://eatsight.ai/v/${venueSlug}`}
                          size={200}
                          fgColor="#722F37"
                          bgColor="#ffffff"
                          ecLevel="M"
                          quietZone={0}
                        />
                      </div>
                      <p className="text-sm text-[#1a1a1a]/50">
                        eatsight.ai/v/{venueSlug}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download QR code
                      </Button>
                      <Button onClick={() => router.push('/dashboard')} className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                        Go to dashboard
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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

'use client'

import { motion } from 'framer-motion'
import { TAG_LABELS, MenuTag } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'
import { RecommendedItem } from '@/lib/recommendations'

interface RecommendationCardsProps {
  recommendations: RecommendedItem[]
  onStartOver: () => void
  showFallbackMessage?: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  }),
}

function getTagDisplay(tag: MenuTag): string {
  const shortLabels: Partial<Record<MenuTag, string>> = {
    mood_comfort: 'Comfort',
    mood_light: 'Light',
    mood_protein: 'Protein',
    mood_warm: 'Warm',
    mood_treat: 'Sweet',
    flavor_umami: 'Umami',
    flavor_spicy: 'Spicy',
    flavor_sweet: 'Sweet',
    flavor_tangy: 'Tangy',
    flavor_smoky: 'Smoky',
    portion_bite: 'Small',
    portion_standard: 'Regular',
    portion_hearty: 'Hearty',
  }
  return shortLabels[tag] || TAG_LABELS[tag]
}

export function RecommendationCards({ recommendations, onStartOver, showFallbackMessage }: RecommendationCardsProps) {
  const getDisplayTags = (tags: MenuTag[]) => {
    return tags.filter(
      (t) =>
        t.startsWith('mood_') ||
        t.startsWith('flavor_') ||
        t.startsWith('diet_') ||
        t.startsWith('allergy_')
    ).slice(0, 4)
  }

  // Separate matched recommendations from fallback items
  const matchedItems = recommendations.filter(item => !item.isFallback)
  const fallbackItems = recommendations.filter(item => item.isFallback)

  return (
    <div className="min-h-screen bg-mesa-ivory relative overflow-hidden">
      {/* Warm gradient blobs */}
      <div className="blob blob-mesa w-[400px] h-[400px] -top-32 -right-32 opacity-15" />
      <div className="blob blob-mesa w-[300px] h-[300px] bottom-0 -left-32 opacity-10" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 min-h-screen flex flex-col px-6 py-12"
      >
        <div className="max-w-sm mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
          >
            <h1 className="text-2xl font-bold text-mesa-ink mb-2">
              Our picks for you
            </h1>
            <p className="text-mesa-graphite mb-6">
              Based on your preferences, we think you&apos;ll love these.
            </p>
          </motion.div>

          {/* Fallback message */}
          {showFallbackMessage && matchedItems.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <p className="text-amber-800 font-medium text-sm">
                We couldn&apos;t find a perfect match for everything you wanted.
              </p>
              <p className="text-amber-700 text-xs mt-1">
                We&apos;ve let the restaurant know — they&apos;re always looking to improve their menu!
              </p>
            </motion.div>
          )}

          {/* Matched recommendations */}
          <div className="space-y-4 mb-4">
            {matchedItems.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-mesa-ink text-lg leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-mesa-500 font-semibold whitespace-nowrap text-lg">
                        €{item.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {item.reason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getDisplayTags(item.tags).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium"
                        >
                          {getTagDisplay(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fallback popular items */}
          {fallbackItems.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mt-6 mb-3">You might also like these popular items:</p>
              <div className="space-y-4 mb-8">
                {fallbackItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={matchedItems.length + index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden opacity-90">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-mesa-ink text-lg leading-tight">
                            {item.name}
                          </h3>
                          <span className="text-mesa-500 font-semibold whitespace-nowrap text-lg">
                            €{item.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          {item.reason}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getDisplayTags(item.tags).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium"
                            >
                              {getTagDisplay(tag)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {fallbackItems.length === 0 && <div className="mb-8" />}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button variant="mesa-outline" className="w-full" onClick={onStartOver}>
              Start over
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { TAG_LABELS, MenuTag } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'
import { RecommendedItem } from '@/lib/recommendations'

interface RecommendationCardsProps {
  recommendations: RecommendedItem[]
  onStartOver: () => void
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

export function RecommendationCards({ recommendations, onStartOver }: RecommendationCardsProps) {
  const getDisplayTags = (tags: MenuTag[]) => {
    return tags.filter(
      (t) =>
        t.startsWith('mood_') ||
        t.startsWith('flavor_') ||
        t.startsWith('diet_') ||
        t.startsWith('allergy_')
    ).slice(0, 4)
  }

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

          <div className="space-y-4 mb-8">
            {recommendations.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-white rounded-[20px] border border-mesa-border shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-mesa-ink text-lg leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-mesa-500 font-semibold whitespace-nowrap text-lg">
                        €{item.price}
                      </span>
                    </div>
                    <p className="text-sm text-mesa-graphite/80 mb-4">
                      {item.reason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getDisplayTags(item.tags).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-mesa-200/50 text-mesa-700 font-medium"
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

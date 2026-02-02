'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'
import { Sparkline } from './Sparkline'

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  sparklineData?: number[]
  color?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel = 'vs last week',
  icon: Icon,
  sparklineData,
  color = '#722F37',
  delay = 0,
}: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-6 hover-lift"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-mesa-charcoal/50 mb-1">{title}</p>
          <div className="text-3xl font-semibold text-mesa-charcoal">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
            />
          </div>
        </div>

        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Trend indicator */}
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-mesa-charcoal/40'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span className="font-medium">
              {isPositive && '+'}{change}%
            </span>
            <span className="text-mesa-charcoal/40 ml-1">{changeLabel}</span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData && (
          <Sparkline
            data={sparklineData}
            trend={isPositive ? 'up' : isNegative ? 'down' : 'neutral'}
          />
        )}
      </div>
    </motion.div>
  )
}

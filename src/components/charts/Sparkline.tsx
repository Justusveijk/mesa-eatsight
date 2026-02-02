'use client'

import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  trend?: 'up' | 'down' | 'neutral'
}

export function Sparkline({
  data,
  color,
  height = 40,
  width = 100,
  trend = 'neutral',
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  const trendColors = {
    up: '#22c55e',
    down: '#ef4444',
    neutral: '#722F37',
  }

  const strokeColor = color || trendColors[trend]

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5 }}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

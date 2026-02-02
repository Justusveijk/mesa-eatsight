'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface RadialProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: string
  sublabel?: string
  animated?: boolean
}

export function RadialProgress({
  value,
  size = 160,
  strokeWidth = 12,
  color = '#722F37',
  bgColor = '#f5f5f5',
  label,
  animated = true,
}: RadialProgressProps) {
  const data = [
    { value: value },
    { value: 100 - value },
  ]

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            animationDuration={1500}
            animationEasing="ease-out"
          >
            <Cell fill={color} />
            <Cell fill={bgColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-semibold text-mesa-charcoal"
        >
          {value}%
        </motion.span>
        {label && (
          <span className="text-sm text-mesa-charcoal/50 mt-1">{label}</span>
        )}
      </div>
    </motion.div>
  )
}

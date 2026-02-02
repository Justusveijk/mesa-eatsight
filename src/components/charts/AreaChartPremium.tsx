'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  value: number
  [key: string]: string | number
}

interface AreaChartPremiumProps {
  data: DataPoint[]
  dataKey?: string
  color?: string
  height?: number
  showGrid?: boolean
  animated?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
}

// Custom tooltip with glass effect
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl px-4 py-3 shadow-lg"
    >
      <p className="text-xs text-mesa-charcoal/50 mb-1">{label}</p>
      <p className="text-lg font-semibold text-mesa-charcoal">
        {payload[0].value?.toLocaleString()}
      </p>
    </motion.div>
  )
}

export function AreaChartPremium({
  data,
  dataKey = 'value',
  color = '#722F37',
  height = 300,
  showGrid = false,
  animated = true,
}: AreaChartPremiumProps) {
  const gradientId = `gradient-${dataKey}`

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e5e5"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 12 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 12 }}
            dx={-10}
            tickFormatter={(value) => value.toLocaleString()}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

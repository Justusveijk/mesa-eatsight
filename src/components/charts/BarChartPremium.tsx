'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DataPoint {
  name: string
  value: number
  color?: string
}

interface BarChartPremiumProps {
  data: DataPoint[]
  color?: string
  height?: number
  horizontal?: boolean
  showLabels?: boolean
  animated?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; payload?: DataPoint }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-xl px-4 py-3 shadow-lg"
    >
      <p className="text-xs text-mesa-charcoal/50 mb-1">{payload[0].payload?.name}</p>
      <p className="text-lg font-semibold text-mesa-charcoal">
        {payload[0].value?.toLocaleString()}
      </p>
    </motion.div>
  )
}

export function BarChartPremium({
  data,
  color = '#722F37',
  height = 300,
  horizontal = false,
  animated = true,
}: BarChartPremiumProps) {
  const colors = [
    '#722F37', // burgundy
    '#C4654A', // terracotta
    '#8B6F47', // brown
    '#A67B5B', // tan
    '#D4C5B0', // sand
  ]

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 10, left: horizontal ? 80 : 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e5e5"
            horizontal={!horizontal}
            vertical={horizontal}
          />

          {horizontal ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(114, 47, 55, 0.05)' }} />

          <Bar
            dataKey="value"
            radius={[6, 6, 6, 6]}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

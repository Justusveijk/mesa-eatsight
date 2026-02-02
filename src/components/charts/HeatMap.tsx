'use client'

import { motion } from 'framer-motion'

interface HeatMapCell {
  day: string
  hour: number
  value: number
}

interface HeatMapProps {
  data: HeatMapCell[]
}

export function HeatMap({ data }: HeatMapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const maxValue = Math.max(...data.map(d => d.value))

  const getColor = (value: number) => {
    const intensity = value / maxValue
    return `rgba(114, 47, 55, ${0.1 + intensity * 0.8})`
  }

  const getValue = (day: string, hour: number) => {
    const cell = data.find(d => d.day === day && d.hour === hour)
    return cell?.value || 0
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-x-auto"
    >
      <div className="min-w-[600px]">
        {/* Hours header */}
        <div className="flex ml-12 mb-2">
          {hours.filter(h => h % 3 === 0).map(hour => (
            <div
              key={hour}
              className="text-xs text-mesa-charcoal/40"
              style={{ width: `${100 / 8}%` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-1">
          {days.map((day, dayIndex) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className="flex items-center gap-2"
            >
              <span className="w-10 text-xs text-mesa-charcoal/50 text-right">{day}</span>
              <div className="flex-1 flex gap-0.5">
                {hours.map(hour => {
                  const value = getValue(day, hour)
                  return (
                    <motion.div
                      key={`${day}-${hour}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (dayIndex * 24 + hour) * 0.002 }}
                      className="flex-1 h-6 rounded-sm cursor-pointer hover:ring-2 hover:ring-mesa-burgundy/30 transition"
                      style={{ backgroundColor: getColor(value) }}
                      title={`${day} ${hour}:00 - ${value} guests`}
                    />
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs text-mesa-charcoal/40">Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
            <div
              key={opacity}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(114, 47, 55, ${opacity})` }}
            />
          ))}
          <span className="text-xs text-mesa-charcoal/40">More</span>
        </div>
      </div>
    </motion.div>
  )
}

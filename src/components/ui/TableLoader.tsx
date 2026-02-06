'use client'

import { motion } from 'framer-motion'

interface TableLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TableLoader({ message = 'Preparing your table...', size = 'md' }: TableLoaderProps) {
  const sizes = {
    sm: { container: 'w-32 h-32', plate: 'w-12 h-12', utensil: 'w-3 h-8' },
    md: { container: 'w-48 h-48', plate: 'w-16 h-16', utensil: 'w-4 h-10' },
    lg: { container: 'w-64 h-64', plate: 'w-20 h-20', utensil: 'w-5 h-12' },
  }

  const s = sizes[size]

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${s.container} relative`}>
        {/* Table surface */}
        <motion.div
          className="absolute inset-x-4 bottom-8 h-2 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-full"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Plate */}
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 bottom-10 ${s.plate} rounded-full bg-white border-4 border-gray-100 shadow-lg`}
          initial={{ y: -60, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            delay: 0.3,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          <div className="absolute inset-2 rounded-full border-2 border-gray-50" />
        </motion.div>

        {/* Fork */}
        <motion.div
          className={`absolute bottom-10 ${s.utensil} rounded-full bg-gradient-to-b from-gray-300 to-gray-400`}
          style={{ left: '25%' }}
          initial={{ x: -40, y: 20, opacity: 0, rotate: -30 }}
          animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          <div className="absolute -top-1 left-0 w-full flex justify-between px-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
          </div>
        </motion.div>

        {/* Knife */}
        <motion.div
          className={`absolute bottom-10 ${s.utensil} rounded-full bg-gradient-to-b from-gray-300 to-gray-400`}
          style={{ right: '25%' }}
          initial={{ x: 40, y: 20, opacity: 0, rotate: 30 }}
          animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        >
          <div className="absolute top-0 -right-0.5 w-1 h-1/2 bg-gray-200 rounded-r-full" />
        </motion.div>

        {/* Napkin */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: 'spring' }}
        />

        {/* Glass */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-4 h-6 bg-gradient-to-b from-white/80 to-blue-50/50 rounded-t-sm rounded-b-lg border border-gray-200"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </motion.div>

        {/* Floating sparkles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
            style={{
              left: `${30 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <motion.p
        className="text-gray-500 text-sm mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Simpler spinner version for inline use
export function TableSpinner() {
  return (
    <div className="flex items-center justify-center gap-1">
      <motion.div
        className="w-2 h-2 bg-emerald-500 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-emerald-500 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
      />
      <motion.div
        className="w-2 h-2 bg-emerald-500 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
      />
    </div>
  )
}

// Full page loader
export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <TableLoader message={message} size="md" />
    </div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, Utensils, Wine } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

export function CartSheet() {
  const { items, totalItems, totalPrice, isOpen, setIsOpen, updateQuantity, removeItem, clearCart } = useCart()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-mesa-burgundy" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-mesa-charcoal">Your Order</h2>
                  <p className="text-sm text-mesa-charcoal/50">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-mesa-charcoal/50">Your order is empty</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 text-mesa-burgundy font-medium"
                  >
                    Browse recommendations
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                    >
                      {/* Type icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.type === 'food'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.type === 'food' ? (
                          <Utensils className="w-5 h-5" />
                        ) : (
                          <Wine className="w-5 h-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-mesa-charcoal truncate">{item.name}</h4>
                        <p className="text-sm text-mesa-burgundy font-semibold tabular-nums">
                          &euro;{item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium text-mesa-charcoal tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-white">
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-mesa-charcoal/60">Total</span>
                  <span className="text-2xl font-serif text-mesa-charcoal tabular-nums">
                    &euro;{totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-4 rounded-2xl border border-gray-200 text-mesa-charcoal font-medium hover:bg-gray-50 transition"
                  >
                    Clear order
                  </button>
                  <button
                    onClick={() => {
                      // In a real app, this would submit the order
                      alert('Order submitted! (Demo only - no real order placed)')
                      clearCart()
                    }}
                    className="flex-1 py-4 rounded-2xl bg-mesa-burgundy text-white font-medium hover:bg-mesa-burgundy/90 transition shadow-lg shadow-mesa-burgundy/25"
                  >
                    Place order
                  </button>
                </div>

                <p className="text-center text-xs text-mesa-charcoal/40 mt-3">
                  Show this to your server to confirm your order
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Floating cart button for showing cart count
export function CartButton() {
  const { totalItems, setIsOpen } = useCart()

  if (totalItems === 0) return null

  return (
    <motion.button
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: 20 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(true)}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-5 py-3 bg-mesa-burgundy text-white rounded-full shadow-xl shadow-mesa-burgundy/30"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="font-medium">{totalItems}</span>
    </motion.button>
  )
}

'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "Our guests love it. Instead of staring at the menu for 10 minutes, they scan, tap, and order with confidence. Table turnover is up 15%.",
    author: "Maria van den Berg",
    role: "Owner",
    venue: "Cafe De Kade, Amsterdam",
    avatar: "MV",
  },
  {
    quote: "The analytics alone are worth it. We finally know what our guests actually want, not what we think they want. Changed our whole menu strategy.",
    author: "Thomas Bakker",
    role: "General Manager",
    venue: "Bistro Willem, Rotterdam",
    avatar: "TB",
  },
  {
    quote: "Setup took 20 minutes. Our staff doesn't need to memorize the menu anymore, and guests with dietary restrictions finally feel taken care of.",
    author: "Sophie de Groot",
    role: "Restaurant Manager",
    venue: "The Green Table, Utrecht",
    avatar: "SG",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-[#F5F3EF]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm uppercase tracking-widest text-[#722F37] mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#1a1a1a]">
            Loved by restaurants
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#1a1a1a]/5"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Quote */}
              <p className="text-[#1a1a1a]/80 mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#722F37] flex items-center justify-center text-white text-sm font-medium">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">{testimonial.author}</p>
                  <p className="text-sm text-[#1a1a1a]/50">{testimonial.role}</p>
                  <p className="text-sm text-[#722F37]">{testimonial.venue}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badge */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-[#1a1a1a]/40">
            Trusted by 50+ restaurants across the Netherlands
          </p>
        </motion.div>
      </div>
    </section>
  )
}

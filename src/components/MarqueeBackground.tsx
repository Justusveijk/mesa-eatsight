'use client'

const row1 = [
  'Margherita Pizza', 'What\'s your mood?', 'Truffle Pasta',
  'Comfort food', 'Grilled Salmon', 'Sweet or savory?',
  'Tiramisu', 'Feeling adventurous?', 'Duck Confit',
]

const row2 = [
  'Comfort', 'Caesar Salad', 'Vegan',
  'Beef Tenderloin', 'Spicy', 'Lobster Bisque',
  'Wine pairing', 'Creme Brulee', 'Chef\'s pick',
]

const row3 = [
  'Light & fresh', 'Risotto', 'Chocolate Lava Cake',
  'Hot or cold?', 'Sea Bass', 'Healthy',
  'Lamb Chops', 'Share with table?', 'Panna Cotta',
]

export function MarqueeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-col justify-center gap-12">
      {/* Row 1 - moves left */}
      <div className="flex animate-marquee-left">
        <div className="flex items-center gap-12 text-white/[0.06] text-lg font-serif whitespace-nowrap">
          {[...row1, ...row1, ...row1].map((item, i) => (
            <span key={i} className="px-4">{item}</span>
          ))}
        </div>
      </div>

      {/* Row 2 - moves right */}
      <div className="flex animate-marquee-right">
        <div className="flex items-center gap-12 text-white/[0.04] text-xl font-serif whitespace-nowrap">
          {[...row2, ...row2, ...row2].map((item, i) => (
            <span key={i} className="px-4">{item}</span>
          ))}
        </div>
      </div>

      {/* Row 3 - moves left slower */}
      <div className="flex animate-marquee-left-slow">
        <div className="flex items-center gap-12 text-white/[0.06] text-lg font-serif whitespace-nowrap">
          {[...row3, ...row3, ...row3].map((item, i) => (
            <span key={i} className="px-4">{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

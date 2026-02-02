'use client'

interface MarqueeProps {
  items: string[]
  speed?: number
  separator?: React.ReactNode
  className?: string
}

export function Marquee({
  items,
  speed = 30,
  separator,
  className = ''
}: MarqueeProps) {
  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items]

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="flex whitespace-nowrap animate-marquee"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {duplicatedItems.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="px-8">{item}</span>
            {separator || (
              <span className="w-2 h-2 rounded-full bg-current opacity-30" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

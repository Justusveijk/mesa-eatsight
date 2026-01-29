import { HTMLAttributes, forwardRef } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'dark' | 'light' | 'auto'
  withNoise?: boolean
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className = '', variant = 'auto', withNoise = false, children, ...props }, ref) => {
    // Auto variant uses CSS dark mode support
    const baseClasses = variant === 'auto'
      ? 'bg-white border border-gray-200 rounded-2xl shadow-sm dark:glass-panel'
      : variant === 'dark'
        ? 'glass-panel'
        : 'glass-panel-light'
    const noiseClass = withNoise ? 'noise-overlay relative' : ''

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${noiseClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = 'GlassPanel'

export { GlassPanel }

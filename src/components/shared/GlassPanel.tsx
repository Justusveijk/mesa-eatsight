import { HTMLAttributes, forwardRef } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'dark' | 'light'
  withNoise?: boolean
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className = '', variant = 'dark', withNoise = false, children, ...props }, ref) => {
    const baseClass = variant === 'dark' ? 'glass-panel' : 'glass-panel-light'
    const noiseClass = withNoise ? 'noise-overlay relative' : ''

    return (
      <div
        ref={ref}
        className={`${baseClass} ${noiseClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = 'GlassPanel'

export { GlassPanel }

import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'signal' | 'signal-outline' | 'mesa' | 'mesa-outline'
  size?: 'default' | 'sm' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-transition'

    const variants = {
      // Legacy/default (uses mesa colors now)
      default: 'bg-mesa-500 text-white hover:bg-mesa-700',
      outline: 'border-2 border-mesa-500 text-mesa-500 hover:bg-mesa-500 hover:text-white',
      ghost: 'hover:bg-mesa-500/10 text-mesa-500',
      // Eatsight coral/signal
      signal: 'bg-signal text-white hover:bg-signal/90 shadow-lg shadow-signal/25',
      'signal-outline': 'border-2 border-signal text-signal hover:bg-signal hover:text-white',
      // MESA warm
      mesa: 'bg-mesa-500 text-white hover:bg-mesa-700',
      'mesa-outline': 'border-2 border-mesa-border text-mesa-ink hover:border-mesa-500 hover:text-mesa-500',
    }

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      default: 'h-11 px-6 py-2',
      lg: 'h-14 px-8 text-lg',
      xl: 'h-16 px-10 text-lg',
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

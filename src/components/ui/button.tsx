import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'primary-outline' | 'mesa' | 'mesa-outline'
  size?: 'default' | 'sm' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      // Default (burgundy)
      default: 'bg-[#722F37] text-white hover:bg-[#5a252c]',
      outline: 'border-2 border-[#722F37] text-[#722F37] hover:bg-[#722F37] hover:text-white',
      ghost: 'hover:bg-[#722F37]/10 text-[#722F37]',
      // Primary (dark blue for dashboard)
      primary: 'bg-[#1e3a5f] text-white hover:bg-[#0f2440]',
      'primary-outline': 'border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white',
      // MESA warm (for guest-facing)
      mesa: 'bg-[#B2472A] text-white hover:bg-[#7A2A18]',
      'mesa-outline': 'border-2 border-[#B2472A] text-[#B2472A] hover:bg-[#B2472A] hover:text-white',
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

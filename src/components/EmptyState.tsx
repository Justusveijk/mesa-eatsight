import Link from 'next/link'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{title}</h3>
      <p className="text-[#1a1a1a]/60 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-block px-6 py-3 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

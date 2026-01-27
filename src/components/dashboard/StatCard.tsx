import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
}

export function StatCard({ title, value, change, changeLabel }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive && <TrendingUp className="w-4 h-4 text-green-500" />}
            {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
            <span
              className={`text-sm ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {isPositive && '+'}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-sm text-gray-500">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

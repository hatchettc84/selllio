import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  description?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={cn(
                'font-medium',
                change.trend === 'up' && 'text-green-600 dark:text-green-400',
                change.trend === 'down' && 'text-red-600 dark:text-red-400',
                change.trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change.trend === 'up' && '+'}
              {change.value}%
            </span>
            <span className="text-muted-foreground">{change.label}</span>
          </div>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}



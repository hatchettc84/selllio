import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'user' | 'webinar' | 'account' | 'system'
  message: string
  timestamp: Date
  user?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user':
        return '👤'
      case 'webinar':
        return '📹'
      case 'account':
        return '🏢'
      case 'system':
        return '⚙️'
      default:
        return '📌'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {displayActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              displayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
                >
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <span className="font-medium">{activity.user}</span>
                      )}
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}



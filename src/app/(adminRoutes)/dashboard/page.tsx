import { getDashboardStats, getRecentActivity } from '@/action/admin/dashboard'
import { MetricCard } from '@/components/admin/dashboard/MetricCard'
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import {
  Users,
  Building2,
  Video,
  DollarSign,
  Brain,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics and activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={{
            value: stats.userGrowth.change,
            label: 'vs last month',
            trend: stats.userGrowth.change >= 0 ? 'up' : 'down',
          }}
          icon={Users}
          description={`${stats.userGrowth.current} new this month`}
        />
        
        <MetricCard
          title="Active Accounts"
          value={stats.activeAccounts.toLocaleString()}
          icon={Building2}
          description="Accounts with active subscriptions"
        />
        
        <MetricCard
          title="Total Webinars"
          value={stats.totalWebinars.toLocaleString()}
          change={{
            value: stats.liveWebinars,
            label: 'live now',
            trend: 'neutral',
          }}
          icon={Video}
          description={`${stats.liveWebinars} currently live`}
        />
        
        <MetricCard
          title="Revenue (MTD)"
          value={`$${stats.revenueMTD.toLocaleString()}`}
          change={{
            value: 0,
            label: 'vs last month',
            trend: 'up',
          }}
          icon={DollarSign}
          description={`$${stats.revenueYTD.toLocaleString()} YTD`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="AI Costs (MTD)"
          value={`$${stats.aiCostsMTD.toFixed(2)}`}
          icon={Brain}
          description="Total AI processing costs this month"
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          description="Attendee to conversion rate"
        />
        
        <MetricCard
          title="AI Usage"
          value={`${stats.aiUsageTokens.toLocaleString()}`}
          icon={Zap}
          description="Total tokens processed"
        />
      </div>

      {/* Activity and Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed activities={activities} />
        <QuickActions />
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Database</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">API Services</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">All Systems Normal</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="mt-1 text-sm font-medium">99.9%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



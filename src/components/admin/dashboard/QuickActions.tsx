import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Settings,
  FileText,
  AlertTriangle,
  Database,
  Users,
} from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    name: 'Create Account',
    href: '/admin/accounts?action=create',
    icon: Plus,
    description: 'Provision a new tenant account',
  },
  {
    name: 'System Health',
    href: '/admin/support/logs',
    icon: Database,
    description: 'View system status and logs',
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage platform users',
  },
  {
    name: 'Settings',
    href: '/admin/settings/general',
    icon: Settings,
    description: 'Platform configuration',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.name} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">{action.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}



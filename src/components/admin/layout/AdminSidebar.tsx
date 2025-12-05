'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Brain,
  Video,
  DollarSign,
  FileText,
  Settings,
  HelpCircle,
  BarChart3,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Accounts',
    href: '/admin/accounts',
    icon: Building2,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'AI Management',
    href: '/admin/ai',
    icon: Brain,
    children: [
      { name: 'Agents', href: '/admin/ai/agents' },
      { name: 'Usage', href: '/admin/ai/usage' },
      { name: 'Presentations', href: '/admin/ai/presentations' },
      { name: 'Settings', href: '/admin/ai/settings' },
    ],
  },
  {
    name: 'Webinars',
    href: '/admin/webinars',
    icon: Video,
    children: [
      { name: 'All Webinars', href: '/admin/webinars' },
      { name: 'Analytics', href: '/admin/webinars/analytics' },
    ],
  },
  {
    name: 'Billing',
    href: '/admin/billing',
    icon: DollarSign,
    children: [
      { name: 'Overview', href: '/admin/billing/overview' },
      { name: 'Subscriptions', href: '/admin/billing/subscriptions' },
      { name: 'Stripe Connect', href: '/admin/billing/stripe-connect' },
      { name: 'Transactions', href: '/admin/billing/transactions' },
    ],
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    children: [
      { name: 'Presentations', href: '/admin/content/presentations' },
      { name: 'Webinars', href: '/admin/content/webinars' },
    ],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/admin/settings/general' },
      { name: 'Features', href: '/admin/settings/features' },
      { name: 'Integrations', href: '/admin/settings/integrations' },
      { name: 'Security', href: '/admin/settings/security' },
    ],
  },
  {
    name: 'Support',
    href: '/admin/support',
    icon: HelpCircle,
    children: [
      { name: 'Tickets', href: '/admin/support/tickets' },
      { name: 'Logs', href: '/admin/support/logs' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Selllio Admin</h1>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
              
              {item.children && active && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm transition-colors',
                        pathname === child.href
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}



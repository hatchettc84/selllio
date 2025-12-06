import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { AdminBreadcrumb } from '@/components/admin/layout/AdminBreadcrumb'
import { isAdmin } from '@/lib/admin/permissions'
import { onAuthenticateUser } from '@/action/auth'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check Clerk authentication first
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Try to get database user with fallback
  let user
  let hasAdminAccess = false

  try {
    const userExist = await onAuthenticateUser()
    if (!userExist.user) {
      redirect('/sign-in')
    }
    user = userExist.user

    // Check admin access
    hasAdminAccess = await isAdmin()
    if (!hasAdminAccess) {
      redirect('/home')
    }
  } catch {
    console.log('Database error in admin layout, redirecting to home')
    // If database fails, redirect to home (can't verify admin status)
    redirect('/home')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader 
          userName={user.name}
          userEmail={user.email}
        />
        
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          <div className="mb-4">
            <AdminBreadcrumb />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}



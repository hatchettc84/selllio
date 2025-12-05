import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { AdminBreadcrumb } from '@/components/admin/layout/AdminBreadcrumb'
import { isAdmin } from '@/lib/admin/permissions'
import { onAuthenticateUser } from '@/action/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const userExist = await onAuthenticateUser()
  if (!userExist.user) {
    redirect('/sign-in')
  }

  // Check admin access
  const hasAdminAccess = await isAdmin()
  if (!hasAdminAccess) {
    redirect('/home')
  }

  const user = userExist.user

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



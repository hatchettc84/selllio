import { onAuthenticateUser } from '@/action/auth'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const AuthCallbackPage = async () => {
  // Check if user is authenticated with Clerk first
  const clerkUser = await currentUser()

  // If authenticated with Clerk, allow access even if DB fails
  if (clerkUser) {
    try {
      const auth = await onAuthenticateUser()

      if (auth.status === 200 || auth.status == 201) {
        redirect('/home')
      }
    } catch (error) {
      console.log('Database error, but Clerk auth succeeded. Proceeding to /home')
    }

    // If database fails but Clerk succeeds, still let them in
    redirect('/home')
  }

  // Not authenticated with Clerk, redirect to home
  redirect('/')
}

export default AuthCallbackPage

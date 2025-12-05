'use server'

import { prismaClient } from '@/lib/prismaClient'
import { currentUser } from '@clerk/nextjs/server'
import { UserRole } from '@prisma/client'

/**
 * Check if current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false

    const dbUser = await prismaClient.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true },
    })

    return dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPER_ADMIN
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if current user has super admin role
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false

    const dbUser = await prismaClient.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true },
    })

    return dbUser?.role === UserRole.SUPER_ADMIN
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Get current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const user = await currentUser()
    if (!user) return null

    const dbUser = await prismaClient.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true },
    })

    return dbUser?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  const hasAccess = await isAdmin()
  if (!hasAccess) {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * Require super admin access - throws error if not super admin
 */
export async function requireSuperAdmin(): Promise<void> {
  const hasAccess = await isSuperAdmin()
  if (!hasAccess) {
    throw new Error('Unauthorized: Super admin access required')
  }
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await currentUser()
    if (!user) return

    const dbUser = await prismaClient.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    })

    if (!dbUser) return

    await prismaClient.adminActivity.create({
      data: {
        adminId: dbUser.id,
        action,
        resource,
        resourceId: resourceId || null,
        details: details ? (details as any) : undefined,
      },
    })
  } catch (error) {
    console.error('Error logging admin activity:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}



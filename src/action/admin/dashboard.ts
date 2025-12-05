'use server'

import { prismaClient } from '@/lib/prismaClient'
import { requireAdmin } from '@/lib/admin/permissions'

interface DashboardStats {
  totalUsers: number
  activeAccounts: number
  totalWebinars: number
  liveWebinars: number
  revenueMTD: number
  revenueYTD: number
  aiUsageTokens: number
  aiCostsMTD: number
  conversionRate: number
  userGrowth: {
    current: number
    previous: number
    change: number
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin()

  try {
    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    )
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Total users
    const totalUsers = await prismaClient.user.count({
      where: { deletedAt: null },
    })

    // Active accounts (users with subscription)
    const activeAccounts = await prismaClient.user.count({
      where: {
        subscription: true,
        deletedAt: null,
      },
    })

    // Total webinars
    const totalWebinars = await prismaClient.webinar.count({
      where: { deletedAt: null },
    })

    // Live webinars
    const liveWebinars = await prismaClient.webinar.count({
      where: {
        webinarStatus: 'LIVE',
        deletedAt: null,
      },
    })

    // User growth (current month vs last month)
    const currentMonthUsers = await prismaClient.user.count({
      where: {
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    })

    const previousMonthUsers = await prismaClient.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        deletedAt: null,
      },
    })

    const userGrowthChange =
      previousMonthUsers > 0
        ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
        : 0

    // AI usage (from presentations)
    const aiStats = await prismaClient.presentation.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        aiCostCents: true,
      },
    })

    // TTS costs (from AI presenter timelines)
    const ttsStats = await prismaClient.aIPresenterTimeline.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        ttsCostCents: true,
      },
    })

    const aiCostsMTD =
      ((aiStats._sum.aiCostCents || 0) +
        (ttsStats._sum.ttsCostCents || 0)) /
      100

    // Revenue (placeholder - would need Stripe integration)
    // For now, using subscription count as proxy
    const revenueMTD = activeAccounts * 99 // Assuming $99/month subscription
    const revenueYTD = activeAccounts * 99 * now.getMonth()

    // Conversion rate (converted attendees / total attendees)
    const totalAttendees = await prismaClient.attendance.count()
    const convertedAttendees = await prismaClient.attendance.count({
      where: { attendedType: 'CONVERTED' },
    })

    const conversionRate =
      totalAttendees > 0 ? (convertedAttendees / totalAttendees) * 100 : 0

    return {
      totalUsers,
      activeAccounts,
      totalWebinars,
      liveWebinars,
      revenueMTD,
      revenueYTD,
      aiUsageTokens: 0, // Would need to track this separately
      aiCostsMTD,
      conversionRate: Math.round(conversionRate * 10) / 10,
      userGrowth: {
        current: currentMonthUsers,
        previous: previousMonthUsers,
        change: Math.round(userGrowthChange * 10) / 10,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch dashboard statistics')
  }
}

export async function getRecentActivity() {
  await requireAdmin()

  try {
    // Get recent user registrations
    const recentUsers = await prismaClient.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    // Get recent webinars
    const recentWebinars = await prismaClient.webinar.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        presenter: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    })

    // Get recent conversions
    const recentConversions = await prismaClient.attendance.findMany({
      take: 5,
      where: { attendedType: 'CONVERTED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        webinar: {
          select: {
            title: true,
          },
        },
        createdAt: true,
      },
    })

    const activities = [
      ...recentUsers.map((user) => ({
        id: user.id,
        type: 'user' as const,
        message: `New user registered: ${user.name}`,
        timestamp: user.createdAt,
        user: user.name,
      })),
      ...recentWebinars.map((webinar) => ({
        id: webinar.id,
        type: 'webinar' as const,
        message: `Webinar created: ${webinar.title}`,
        timestamp: webinar.createdAt,
        user: webinar.presenter.name,
      })),
      ...recentConversions.map((conversion) => ({
        id: conversion.id,
        type: 'webinar' as const,
        message: `Conversion: ${conversion.user.name} converted in ${conversion.webinar.title}`,
        timestamp: conversion.createdAt,
        user: conversion.user.name,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return activities
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}



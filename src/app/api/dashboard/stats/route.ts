import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token) as any
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = decoded

    // Get basic counts
    const [
      totalAssets,
      activeAssets,
      totalDocuments,
      activeDocuments,
      totalUsers,
      activeUsers,
      recentAuditActivities
    ] = await Promise.all([
      prisma.asset.count({
        where: user.role === 'ADMIN' ? {} : { department: user.department }
      }),
      prisma.asset.count({
        where: {
          isActive: true,
          ...(user.role === 'ADMIN' ? {} : { department: user.department })
        }
      }),
      prisma.document.count({
        where: user.role === 'ADMIN' ? {} : { department: user.department }
      }),
      prisma.document.count({
        where: {
          isActive: true,
          ...(user.role === 'ADMIN' ? {} : { department: user.department })
        }
      }),
      user.role === 'ADMIN' ? prisma.user.count() : 0,
      user.role === 'ADMIN' ? prisma.user.count({ where: { isActive: true } }) : 0,
      user.role === 'ADMIN' ? prisma.auditLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }) : 0
    ])

    // Get assets by category
    const assetsByCategory = await prisma.asset.groupBy({
      by: ['category'],
      _count: { id: true },
      where: {
        isActive: true,
        ...(user.role === 'ADMIN' ? {} : { department: user.department })
      }
    })

    // Get documents over last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const documentsOverTime = await prisma.document.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        },
        ...(user.role === 'ADMIN' ? {} : { department: user.department })
      },
      select: {
        createdAt: true
      }
    })

    // Process documents over time data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const documentsTimeData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = monthNames[date.getMonth()]
      
      const count = documentsOverTime.filter(doc => {
        const docDate = new Date(doc.createdAt)
        return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear()
      }).length
      
      return { month: monthName, count }
    })

    // Get recent audit activities for admin
    let recentAuditActivitiesData: Array<{ date: string; action: string; resource: string; count: number }> = []
    if (user.role === 'ADMIN') {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      })

      // Process audit data by day
      const dayNames = ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago']
      recentAuditActivitiesData = dayNames.map((dayName, index) => {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - index)
        targetDate.setHours(0, 0, 0, 0)
        
        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const dayLogs = auditLogs.filter(log => {
          const logDate = new Date(log.timestamp)
          return logDate >= targetDate && logDate < nextDay
        })
        
        const totalCount = dayLogs.length
        
        return {
          date: dayName,
          action: 'ALL',
          resource: 'System',
          count: totalCount
        }
      }).filter(item => item.count > 0)
    }

    // Format assets by category data
    const categoryColors = {
      'Computer & IT': '#187F7E',
      'Furniture': '#00AAA8',
      'Equipment': '#0EB6B4',
      'Vehicle': '#D4AF37',
      'Office Supplies': '#E8E8E8',
      'Others': '#6B7280'
    }

    const assetsCategoryData = assetsByCategory.map(category => ({
      name: category.category || 'Others',
      count: category._count.id,
      color: categoryColors[category.category as keyof typeof categoryColors] || '#6B7280'
    }))

    const stats = {
      totalAssets,
      activeAssets,
      totalDocuments,
      activeDocuments,
      totalUsers,
      activeUsers,
      recentActivities: recentAuditActivities,
      assetsByCategory: assetsCategoryData,
      documentsOverTime: documentsTimeData,
      recentAuditActivities: recentAuditActivitiesData
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
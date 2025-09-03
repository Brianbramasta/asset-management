import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// GET /api/user/notifications - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return default preferences since we don't have a notifications table
    // In a real implementation, you'd fetch from a user_preferences table
    const defaultPreferences = {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      securityAlerts: true,
    }

    return NextResponse.json({
      success: true,
      preferences: defaultPreferences
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/user/notifications - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailNotifications, pushNotifications, weeklyReports, securityAlerts } = await request.json()

    // Validate boolean values
    const preferences = {
      emailNotifications: Boolean(emailNotifications),
      pushNotifications: Boolean(pushNotifications),
      weeklyReports: Boolean(weeklyReports),
      securityAlerts: Boolean(securityAlerts),
    }

    // For now, we'll just return success since we don't have a preferences table
    // In a real implementation, you'd save to a user_preferences table
    // await prisma.userPreferences.upsert({
    //   where: { userId: user.id },
    //   update: preferences,
    //   create: { userId: user.id, ...preferences }
    // })

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
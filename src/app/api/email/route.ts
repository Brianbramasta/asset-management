import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import jwt from 'jsonwebtoken'

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

// POST /api/email/test - Send test email
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, email, title, message, alertType, details } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    let result
    switch (type) {
      case 'test':
        result = await emailService.sendTestEmail(email)
        break
      case 'notification':
        if (!title || !message) {
          return NextResponse.json({ error: 'Title and message are required for notifications' }, { status: 400 })
        }
        result = await emailService.sendNotificationEmail(email, title, message)
        break
      case 'security':
        if (!alertType || !details) {
          return NextResponse.json({ error: 'Alert type and details are required for security alerts' }, { status: 400 })
        }
        result = await emailService.sendSecurityAlert(email, alertType, details)
        break
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageIds: result.message_ids
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
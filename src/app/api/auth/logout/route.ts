import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Log logout activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'LOGOUT',
      'User',
      (request as any).user.id,
      null,
      null,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Toggle user status (Admin only)
export const PATCH = withRole(['ADMIN'])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deactivating the current user
    const currentUser = (request as any).user
    if (currentUser.id === params.id && !isActive) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      currentUser.id,
      isActive ? 'ACTIVATE' : 'DEACTIVATE',
      'User',
      updatedUser.id,
      { isActive: existingUser.isActive },
      { isActive: updatedUser.isActive },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      user: updatedUser,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
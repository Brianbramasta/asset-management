import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'
import bcrypt from 'bcryptjs'

// Get user by ID (Admin only)
export const GET = withRole(['ADMIN'])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        lastLogin: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Update user (Admin only)
export const PUT = withRole(['ADMIN'])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const {
      email,
      username,
      firstName,
      lastName,
      role,
      department,
      position,
      isActive,
    } = await request.json()

    if (!email || !username || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, username, firstName, and lastName are required' },
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

    // Check if email or username is already taken by another user
    const duplicateUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [
              { email },
              { username },
            ],
          },
        ],
      },
    })

    if (duplicateUser) {
      return NextResponse.json(
        { error: duplicateUser.email === email 
          ? 'Email is already taken by another user' 
          : 'Username is already taken by another user'
        },
        { status: 409 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        email,
        username,
        firstName,
        lastName,
        role,
        department,
        position,
        isActive,
      },
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
      (request as any).user.id,
      'UPDATE',
      'User',
      updatedUser.id,
      existingUser,
      updatedUser,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Delete user (Admin only)
export const DELETE = withRole(['ADMIN'])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
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

    // Prevent deleting the current user
    const currentUser = (request as any).user
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      currentUser.id,
      'DELETE',
      'User',
      existingUser.id,
      existingUser,
      null,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
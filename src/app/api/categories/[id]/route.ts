import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get single category
export const GET = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Extract id from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Update category (Admin only)
export const PUT = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Extract id from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const {
      name,
      description,
      isActive,
    } = await request.json()

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim(),
        description,
        isActive,
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
      'Category',
      category.id,
      existingCategory,
      category,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      category,
      message: 'Category updated successfully',
    })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Delete category (Admin only)
export const DELETE = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Extract id from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'DELETE',
      'Category',
      existingCategory.id,
      existingCategory,
      null,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
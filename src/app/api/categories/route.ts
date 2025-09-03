import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get all categories by type (Admin only)
export const GET = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'ASSET' // ASSET, DOCUMENT, DEPARTMENT

    const categories = await prisma.category.findMany({
      where: { type: type as any },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Create category (Admin only)
export const POST = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'ASSET'
    
    const {
      name,
      description,
      isActive = true,
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category with this name and type already exists
    const existing = await prisma.category.findFirst({
      where: { 
        name: name.trim(),
        type: type as any
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists for this type' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type: type as any,
        description,
        isActive,
        createdById: (request as any).user.id,
      },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'CREATE',
      'Category',
      category.id,
      null,
      { name, type },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      category,
      message: 'Category created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
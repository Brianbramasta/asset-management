import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get all watermark configurations (Admin only)
export const GET = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const watermarks = await prisma.watermarkConfig.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ watermarks })
  } catch (error) {
    console.error('Get watermarks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Create watermark configuration (Admin only)
export const POST = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const {
      department,
      text,
      opacity = 0.3,
      position = 'center',
      fontSize = 12,
      color = '#888888',
      isActive = true,
    } = await request.json()

    if (!department || !text) {
      return NextResponse.json(
        { error: 'Department and watermark text are required' },
        { status: 400 }
      )
    }

    // Check if watermark for this department already exists
    const existing = await prisma.watermarkConfig.findUnique({
      where: { department },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Watermark configuration for this department already exists' },
        { status: 409 }
      )
    }

    const watermark = await prisma.watermarkConfig.create({
      data: {
        department,
        text,
        opacity,
        position,
        fontSize,
        color,
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
      'WatermarkConfig',
      watermark.id,
      null,
      { department, text },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      watermark,
      message: 'Watermark configuration created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create watermark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get watermark by department
export const GET = withRole(['ADMIN', 'USER'])(async (request: NextRequest) => {
  try {
    // Extract department from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const department = pathSegments[pathSegments.length - 1]

    const watermark = await prisma.watermarkConfig.findUnique({
      where: { department },
    })

    if (!watermark) {
      return NextResponse.json(
        { error: 'Watermark configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ watermark })
  } catch (error) {
    console.error('Get watermark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Update watermark configuration (Admin only)
export const PUT = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Extract department from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const department = pathSegments[pathSegments.length - 1]

    const {
      text,
      opacity,
      position,
      fontSize,
      color,
      isActive,
    } = await request.json()

    const existingWatermark = await prisma.watermarkConfig.findUnique({
      where: { department },
    })

    if (!existingWatermark) {
      return NextResponse.json(
        { error: 'Watermark configuration not found' },
        { status: 404 }
      )
    }

    const watermark = await prisma.watermarkConfig.update({
      where: { department },
      data: {
        text,
        opacity,
        position,
        fontSize,
        color,
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
      'WatermarkConfig',
      watermark.id,
      existingWatermark,
      watermark,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      watermark,
      message: 'Watermark configuration updated successfully',
    })
  } catch (error) {
    console.error('Update watermark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Delete watermark configuration (Admin only)
export const DELETE = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Extract department from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const department = pathSegments[pathSegments.length - 1]

    const existingWatermark = await prisma.watermarkConfig.findUnique({
      where: { department },
    })

    if (!existingWatermark) {
      return NextResponse.json(
        { error: 'Watermark configuration not found' },
        { status: 404 }
      )
    }

    await prisma.watermarkConfig.delete({
      where: { department },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'DELETE',
      'WatermarkConfig',
      existingWatermark.id,
      existingWatermark,
      null,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Watermark configuration deleted successfully',
    })
  } catch (error) {
    console.error('Delete watermark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
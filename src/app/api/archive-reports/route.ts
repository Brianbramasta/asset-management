import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'

// Get archive reports (Admin and Users can see their department's reports)
export const GET = withRole(['ADMIN', 'USER'])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department = searchParams.get('department') || ''
    const action = searchParams.get('action') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit
    const user = (request as any).user

    // Build where conditions
    const whereConditions: any = {}

    // If user is not admin, only show their department's reports
    if (user.role !== 'ADMIN') {
      whereConditions.department = user.department || ''
    } else if (department) {
      whereConditions.department = department
    }

    if (action) {
      whereConditions.action = action
    }

    if (startDate || endDate) {
      whereConditions.timestamp = {}
      if (startDate) {
        whereConditions.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        whereConditions.timestamp.lte = new Date(endDate)
      }
    }

    const [reports, total] = await Promise.all([
      prisma.archiveReport.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.archiveReport.count({ where: whereConditions }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get archive reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Create archive report entry
export const POST = withRole(['ADMIN', 'USER'])(async (request: NextRequest) => {
  try {
    const {
      documentId,
      department,
      action,
      reason,
      notes,
    } = await request.json()

    if (!documentId || !department || !action) {
      return NextResponse.json(
        { error: 'Document ID, department, and action are required' },
        { status: 400 }
      )
    }

    const report = await prisma.archiveReport.create({
      data: {
        documentId,
        department,
        action,
        performedBy: (request as any).user.id,
        reason,
        notes,
      },
    })

    return NextResponse.json({
      report,
      message: 'Archive report created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create archive report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
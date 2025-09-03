import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Create maintenance record
export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const {
      type,
      description,
      scheduledDate,
      completedDate,
      cost,
      vendor,
      notes,
      status,
    } = await request.json()

    if (!type || !description || !scheduledDate) {
      return NextResponse.json(
        { error: 'Type, description, and scheduled date are required' },
        { status: 400 }
      )
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Create maintenance record
    const maintenance = await prisma.maintenance.create({
      data: {
        assetId: params.id,
        type,
        description,
        scheduledDate: new Date(scheduledDate),
        completedDate: completedDate ? new Date(completedDate) : null,
        cost: cost ? parseFloat(cost) : null,
        vendor,
        notes,
        status: status || 'SCHEDULED',
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
      'Maintenance',
      maintenance.id,
      null,
      { assetId: params.id, type, description },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      maintenance,
      message: 'Maintenance record created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create maintenance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Get maintenance records for asset
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        where: { assetId: params.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.maintenance.count({
        where: { assetId: params.id },
      }),
    ])

    return NextResponse.json({
      maintenances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get maintenances error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
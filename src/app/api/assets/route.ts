import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Create asset
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      currentValue,
      condition,
      location,
      department,
      assignedTo,
      warrantyUntil,
      notes,
      tags,
      barcode,
    } = await request.json()

    if (!name || !category || !location) {
      return NextResponse.json(
        { error: 'Name, category, and location are required' },
        { status: 400 }
      )
    }

    // Check if serial number or barcode already exists
    if (serialNumber) {
      const existingAsset = await prisma.asset.findUnique({
        where: { serialNumber },
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this serial number already exists' },
          { status: 409 }
        )
      }
    }

    if (barcode) {
      const existingAsset = await prisma.asset.findUnique({
        where: { barcode },
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this barcode already exists' },
          { status: 409 }
        )
      }
    }

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        category,
        subcategory,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        condition: condition || 'GOOD',
        location,
        department,
        assignedTo,
        warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
        notes,
        tags,
        barcode,
        createdById: (request as any).user.id,
        updatedById: (request as any).user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
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
      'Asset',
      asset.id,
      null,
      { name, category, location },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      asset,
      message: 'Asset created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Get assets
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const condition = searchParams.get('condition') || ''
    const location = searchParams.get('location') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
            { model: { contains: search, mode: 'insensitive' as const } },
            { serialNumber: { contains: search, mode: 'insensitive' as const } },
            { barcode: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {},
        category ? { category: { contains: category, mode: 'insensitive' as const } } : {},
        condition ? { condition: condition as any } : {},
        location ? { location: { contains: location, mode: 'insensitive' as const } } : {},
        // Default to showing only active assets unless explicitly requested otherwise
        isActive !== null ? { isActive: isActive === 'true' } : { isActive: true },
      ],
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({ where }),
    ])

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get assets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
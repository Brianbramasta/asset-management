import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Duplicate asset
export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Extract id from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 2] // Get the asset ID before 'duplicate'

    // Get the original asset
    const originalAsset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!originalAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Create new asset with duplicated data
    const duplicatedAsset = await prisma.asset.create({
      data: {
        name: `${originalAsset.name} (Copy)`,
        description: originalAsset.description,
        category: originalAsset.category,
        subcategory: originalAsset.subcategory,
        brand: originalAsset.brand,
        model: originalAsset.model,
        // Don't copy unique identifiers
        serialNumber: null,
        barcode: null,
        condition: originalAsset.condition,
        location: originalAsset.location,
        department: originalAsset.department,
        assignedTo: null, // Don't assign to same person
        purchasePrice: originalAsset.purchasePrice,
        currentValue: originalAsset.currentValue,
        purchaseDate: originalAsset.purchaseDate,
        warrantyUntil: originalAsset.warrantyUntil,
        notes: originalAsset.notes ? `${originalAsset.notes} (Duplicated from ${originalAsset.name})` : null,
        tags: originalAsset.tags,
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

    // Log activity for original asset (viewed/duplicated)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'DUPLICATE',
      'Asset',
      id,
      { name: originalAsset.name },
      { duplicatedTo: duplicatedAsset.id, duplicatedName: duplicatedAsset.name },
      ipAddress,
      userAgent
    )

    // Log activity for new asset (created through duplication)
    await logActivity(
      (request as any).user.id,
      'CREATE',
      'Asset',
      duplicatedAsset.id,
      null,
      { 
        name: duplicatedAsset.name, 
        category: duplicatedAsset.category,
        location: duplicatedAsset.location,
        source: 'duplicated',
        originalAssetId: id
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      asset: duplicatedAsset,
      message: 'Asset duplicated successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Duplicate asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
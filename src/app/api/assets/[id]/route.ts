import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get single asset
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Extract asset ID from the URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const assetId = pathSegments[pathSegments.length - 1]

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
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
        maintenances: {
          orderBy: { createdAt: 'desc' },
        },
        audits: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Log view activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'VIEW',
      'Asset',
      assetId,
      null,
      { name: asset.name, category: asset.category, location: asset.location },
      ipAddress,
      userAgent
    )

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Get asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Update asset
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    // Extract asset ID from the URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const assetId = pathSegments[pathSegments.length - 1]

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
      isActive,
    } = await request.json()

    // Get current asset data for audit log
    const currentAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!currentAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Check if serial number or barcode already exists (excluding current asset)
    if (serialNumber && serialNumber !== currentAsset.serialNumber) {
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

    if (barcode && barcode !== currentAsset.barcode) {
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

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
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
        condition,
        location,
        department,
        assignedTo,
        warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
        notes,
        tags,
        barcode,
        isActive,
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
        updatedBy: {
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
      'UPDATE',
      'Asset',
      assetId,
      {
        name: currentAsset.name,
        condition: currentAsset.condition,
        location: currentAsset.location,
      },
      { name, condition, location },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      asset: updatedAsset,
      message: 'Asset updated successfully',
    })
  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Delete asset (soft delete)
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    // Extract asset ID from the URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const assetId = pathSegments[pathSegments.length - 1]

    // Get current asset data for audit log
    const currentAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!currentAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.asset.update({
      where: { id: assetId },
      data: { 
        isActive: false,
        updatedById: (request as any).user.id,
      },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      (request as any).user.id,
      'DELETE',
      'Asset',
      assetId,
      { isActive: true },
      { isActive: false },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
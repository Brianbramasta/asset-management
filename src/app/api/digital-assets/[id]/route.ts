import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { checkUserPermissions, SYSTEM_MODULES } from '@/lib/permissions'

const prisma = new PrismaClient()

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

// Helper function to log audit trail
async function logAuditTrail(userId: string, action: string, resourceId?: string, oldValues?: any, newValues?: any, req?: NextRequest) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource: 'DigitalAsset',
        resourceId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'unknown',
        userAgent: req?.headers.get('user-agent') || 'unknown',
      },
    })
  } catch (error) {
    console.error('Failed to log audit trail:', error)
  }
}

// GET /api/digital-assets/[id] - Get single digital asset
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check read permissions
    const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
    if (!permissions.canRead) {
      return NextResponse.json(
        { error: 'You do not have permission to view digital assets' },
        { status: 403 }
      )
    }

    const digitalAsset = await prisma.digitalAsset.findUnique({
      where: { id, isActive: true },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!digitalAsset) {
      return NextResponse.json(
        { error: 'Digital asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ digitalAsset })
  } catch (error) {
    console.error('Failed to fetch digital asset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital asset' },
      { status: 500 }
    )
  }
}

// PUT /api/digital-assets/[id] - Update digital asset
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check write permissions
    const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
    if (!permissions.canWrite) {
      return NextResponse.json(
        { error: 'You do not have permission to edit digital assets' },
        { status: 403 }
      )
    }

    // Get existing asset for audit log
    const existingAsset = await prisma.digitalAsset.findUnique({
      where: { id, isActive: true }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Digital asset not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const {
      contentName,
      description,
      aspectRatio,
      googleDriveLink,
      previewFile,
      previewFileName,
      previewFileSize,
      tags,
      department,
    } = data

    // Validate required fields
    if (!contentName || !aspectRatio) {
      return NextResponse.json(
        { error: 'Content name and aspect ratio are required' },
        { status: 400 }
      )
    }

    // Validate aspect ratio
    if (!['RATIO_4_3', 'RATIO_9_16'].includes(aspectRatio)) {
      return NextResponse.json(
        { error: 'Invalid aspect ratio. Must be RATIO_4_3 or RATIO_9_16' },
        { status: 400 }
      )
    }

    // Update digital asset
    const digitalAsset = await prisma.digitalAsset.update({
      where: { id },
      data: {
        contentName,
        description,
        aspectRatio,
        googleDriveLink,
        previewFile,
        previewFileName,
        previewFileSize,
        tags,
        department: department || existingAsset.department,
        updatedById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Log audit trail
    await logAuditTrail(user.id, 'UPDATE_DIGITAL_ASSET', digitalAsset.id, existingAsset, digitalAsset, request)

    return NextResponse.json({ digitalAsset })
  } catch (error) {
    console.error('Failed to update digital asset:', error)
    return NextResponse.json(
      { error: 'Failed to update digital asset' },
      { status: 500 }
    )
  }
}

// DELETE /api/digital-assets/[id] - Delete digital asset
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check delete permissions
    const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
    if (!permissions.canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete digital assets' },
        { status: 403 }
      )
    }

    // Get existing asset for audit log
    const existingAsset = await prisma.digitalAsset.findUnique({
      where: { id, isActive: true }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Digital asset not found' },
        { status: 404 }
      )
    }

    // Soft delete the digital asset
    await prisma.digitalAsset.update({
      where: { id },
      data: {
        isActive: false,
        updatedById: user.id,
      },
    })

    // Log audit trail
    await logAuditTrail(user.id, 'DELETE_DIGITAL_ASSET', id, existingAsset, null, request)

    return NextResponse.json({ message: 'Digital asset deleted successfully' })
  } catch (error) {
    console.error('Failed to delete digital asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete digital asset' },
      { status: 500 }
    )
  }
}
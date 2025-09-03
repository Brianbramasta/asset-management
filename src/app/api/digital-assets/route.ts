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
    console.error('Token verification error:', error instanceof Error ? error.message : error)
    return null
  }
}

// Helper function to check if user can edit/delete digital assets
async function canEditDigitalAssets(user: any): Promise<boolean> {
  const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
  return permissions.canWrite
}

// Helper function to check if user can delete digital assets
async function canDeleteDigitalAssets(user: any): Promise<boolean> {
  const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
  return permissions.canDelete
}

// Helper function to check if user can view digital assets
async function canViewDigitalAssets(user: any): Promise<boolean> {
  const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
  return permissions.canRead
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

// GET /api/digital-assets - List all digital assets with filtering
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const aspectRatio = searchParams.get('aspectRatio') || ''
    const department = searchParams.get('department') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    // Add search filter
    if (search) {
      where.OR = [
        { contentName: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    // Add aspect ratio filter
    if (aspectRatio) {
      where.aspectRatio = aspectRatio
    }

    // Add department filter based on user role
    if (user.role === 'ADMIN') {
      // Admin users see all digital assets (no department restriction)
      // Optional department filter for admin only applies when department param is provided
      if (department && department !== 'all') {
        where.department = department
      }
    } else {
      // For non-admin users, show assets from their department OR assets with no department
      const userDept = user.department
      const departmentFilter = {
        OR: [
          { department: userDept },
          { department: null },
          { department: '' }
        ]
      }
      
      // If we already have a search filter, combine with department filter using AND
      if (search) {
        where.AND = [
          {
            OR: [
              { contentName: { contains: search } },
              { description: { contains: search } },
              { tags: { contains: search } },
            ]
          },
          departmentFilter
        ]
        delete where.OR // Remove the search OR since it's now in AND clause
      } else {
        // No search filter, just apply department filter
        Object.assign(where, departmentFilter)
      }
    }

    // Get total count
    const total = await prisma.digitalAsset.count({ where })

    // Get digital assets with pagination
    const digitalAssets = await prisma.digitalAsset.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      digitalAssets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch digital assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital assets' },
      { status: 500 }
    )
  }
}

// POST /api/digital-assets - Create new digital asset
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can create digital assets
    const canCreate = await canEditDigitalAssets(user)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'You do not have permission to create digital assets' },
        { status: 403 }
      )
    }

    const contentType = request.headers.get('content-type')
    let data: any
    let previewFileBuffer: string | null = null
    let previewFileName: string | null = null
    let previewFileSize: number | null = null

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData()
      const previewFile = formData.get('previewFile') as File | null
      
      data = {
        contentName: formData.get('contentName') as string,
        description: formData.get('description') as string,
        aspectRatio: formData.get('aspectRatio') as string,
        googleDriveLink: formData.get('googleDriveLink') as string,
        tags: formData.get('tags') as string,
        department: formData.get('department') as string,
      }

      // Process uploaded file if present
      if (previewFile && previewFile.size > 0) {
        // Convert file to base64 for storage
        const bytes = await previewFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        previewFileBuffer = buffer.toString('base64')
        previewFileName = previewFile.name
        previewFileSize = previewFile.size
      }
    } else {
      // Handle JSON data (legacy support)
      data = await request.json()
      previewFileBuffer = data.previewFile
      previewFileName = data.previewFileName
      previewFileSize = data.previewFileSize
    }

    const {
      contentName,
      description,
      aspectRatio,
      googleDriveLink,
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

    // Create digital asset
    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        contentName,
        description,
        aspectRatio,
        googleDriveLink,
        previewFile: previewFileBuffer,
        previewFileName,
        previewFileSize,
        tags,
        department: department || user.department || 'Digital', // Default to 'Digital' if no department
        createdById: user.id,
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
    await logAuditTrail(user.id, 'CREATE_DIGITAL_ASSET', digitalAsset.id, null, digitalAsset, request)

    return NextResponse.json({ digitalAsset }, { status: 201 })
  } catch (error) {
    console.error('Failed to create digital asset:', error)
    return NextResponse.json(
      { error: 'Failed to create digital asset' },
      { status: 500 }
    )
  }
}

// GET /api/digital-assets/permissions - Get user permissions for digital assets
export async function PATCH(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await checkUserPermissions(user.department, user.role, SYSTEM_MODULES.DIGITAL_ASSETS)
    
    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Failed to get permissions:', error)
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    )
  }
}
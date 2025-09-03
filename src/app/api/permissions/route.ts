import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

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

// GET /api/permissions - Get all permissions for a department or all permissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')

    let where: any = { isActive: true }
    
    // Admin can see all permissions, users can only see their department's permissions
    if (user.role !== 'ADMIN') {
      where.department = user.department
    } else if (department) {
      where.department = department
    }

    const permissions = await prisma.departmentPermission.findMany({
      where,
      orderBy: [
        { department: 'asc' },
        { module: 'asc' }
      ]
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

// POST /api/permissions - Create or update permission (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { department, module, canRead, canWrite, canDelete } = data

    if (!department || !module) {
      return NextResponse.json(
        { error: 'Department and module are required' },
        { status: 400 }
      )
    }

    // Check if permission already exists
    const existingPermission = await prisma.departmentPermission.findUnique({
      where: {
        department_module: {
          department,
          module
        }
      }
    })

    let permission
    if (existingPermission) {
      // Update existing permission
      permission = await prisma.departmentPermission.update({
        where: { id: existingPermission.id },
        data: {
          canRead: Boolean(canRead),
          canWrite: Boolean(canWrite),
          canDelete: Boolean(canDelete),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new permission
      permission = await prisma.departmentPermission.create({
        data: {
          department,
          module,
          canRead: Boolean(canRead),
          canWrite: Boolean(canWrite),
          canDelete: Boolean(canDelete),
          createdById: user.id
        }
      })
    }

    return NextResponse.json({ permission }, { status: existingPermission ? 200 : 201 })
  } catch (error) {
    console.error('Failed to create/update permission:', error)
    return NextResponse.json(
      { error: 'Failed to create/update permission' },
      { status: 500 }
    )
  }
}

// DELETE /api/permissions - Delete permission (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    await prisma.departmentPermission.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Permission deleted successfully' })
  } catch (error) {
    console.error('Failed to delete permission:', error)
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}
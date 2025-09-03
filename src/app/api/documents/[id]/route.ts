import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Get single document
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const user = (request as any).user
    const params = await context.params
    
    const document = await prisma.document.findUnique({
      where: { id: params.id },
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
        approvals: true,
        revisions: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Department-based access control: Users can only access their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && document.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Update document
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { title, description, category, subcategory, department, watermark, tags, expiryDate, isActive } = await request.json()
    const user = (request as any).user
    const params = await context.params

    // Get current document data for audit log
    const currentDocument = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!currentDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Department-based access control: Users can only update their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && currentDocument.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        title,
        description,
        category,
        subcategory,
        department: department || currentDocument.department,
        watermark,
        tags,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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
      'Document',
      params.id,
      {
        title: currentDocument.title,
        category: currentDocument.category,
        isActive: currentDocument.isActive,
      },
      { title, category, isActive },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      document: updatedDocument,
      message: 'Document updated successfully',
    })
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Delete document (soft delete)
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const user = (request as any).user
    const params = await context.params
    
    // Get current document data for audit log
    const currentDocument = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!currentDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Department-based access control: Users can only delete their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && currentDocument.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.document.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        updatedById: user.id,
      },
    })

    // Create archive report entry
    await prisma.archiveReport.create({
      data: {
        documentId: params.id,
        department: currentDocument.department || 'Unknown',
        action: 'OUT',
        performedBy: user.id,
        reason: 'Document deleted',
        notes: `Document '${currentDocument.title}' was removed from archive`,
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
      'Document',
      params.id,
      { isActive: true },
      { isActive: false },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
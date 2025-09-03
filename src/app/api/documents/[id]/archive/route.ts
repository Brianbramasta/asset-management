import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Archive document - move to archive (different from delete)
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params
    const documentId = params.id
    const { reason, notes } = await request.json()
    const user = (request as any).user

    // Check if document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Department-based access control: Users can only archive their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && document.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if document is already archived
    if (!document.isActive) {
      return NextResponse.json(
        { error: 'Document is already archived' },
        { status: 400 }
      )
    }

    // Archive the document (set isActive to false but keep the record)
    const archivedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isActive: false,
        updatedById: user.id,
      },
    })

    // Create archive report entry
    await prisma.archiveReport.create({
      data: {
        documentId: documentId,
        department: document.department || 'Unknown',
        action: 'OUT',
        performedBy: user.id,
        reason: reason || 'Document archived by user',
        notes: notes || `Document '${document.title}' moved to archive`,
      },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      user.id,
      'ARCHIVE',
      'Document',
      documentId,
      { isActive: true },
      { isActive: false, reason, notes },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Document archived successfully',
      document: archivedDocument,
    })
  } catch (error) {
    console.error('Archive document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Restore document from archive
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params
    const documentId = params.id
    const { reason, notes } = await request.json().catch(() => ({}))
    const user = (request as any).user

    // Check if document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Department-based access control: Users can only restore their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && document.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if document is actually archived
    if (document.isActive) {
      return NextResponse.json(
        { error: 'Document is not archived' },
        { status: 400 }
      )
    }

    // Restore the document
    const restoredDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isActive: true,
        updatedById: user.id,
      },
    })

    // Create archive report entry for restoration
    await prisma.archiveReport.create({
      data: {
        documentId: documentId,
        department: document.department || 'Unknown',
        action: 'IN',
        performedBy: user.id,
        reason: reason || 'Document restored from archive',
        notes: notes || `Document '${document.title}' restored from archive`,
      },
    })

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      user.id,
      'RESTORE',
      'Document',
      documentId,
      { isActive: false },
      { isActive: true, reason, notes },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Document restored successfully',
      document: restoredDocument,
    })
  } catch (error) {
    console.error('Restore document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
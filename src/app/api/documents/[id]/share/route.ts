import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'

// Share document - generate shareable link
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params
    const documentId = params.id
    const { expiresIn = 24 } = await request.json() // Hours until expiration
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

    // Department-based access control: Users can only share their department's documents (except ADMIN)
    if (user.role !== 'ADMIN' && document.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate share token (simple implementation)
    const shareToken = Buffer.from(`${documentId}:${Date.now()}:${Math.random()}`).toString('base64url')
    const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000)) // Convert hours to milliseconds

    // Store share information (you might want to create a DocumentShare table)
    // For now, we'll return the share link
    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/documents/${shareToken}`

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity(
      user.id,
      'SHARE',
      'Document',
      documentId,
      null,
      { shareToken, expiresAt: expiresAt.toISOString() },
      ipAddress,
      userAgent
    )

    // Create archive report entry for sharing
    await prisma.archiveReport.create({
      data: {
        documentId: documentId,
        department: document.department || 'Unknown',
        action: 'SHARED',
        performedBy: user.id,
        reason: 'Document shared externally',
        notes: `Document '${document.title}' shared via link, expires at ${expiresAt.toISOString()}`,
      },
    })

    return NextResponse.json({
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      message: 'Document shared successfully',
    })
  } catch (error) {
    console.error('Share document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
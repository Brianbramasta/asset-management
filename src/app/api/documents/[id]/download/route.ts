import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { createArchiveReport } from '@/lib/archive-helper'

export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params
    
    // Get document info
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check department access
    const user = (request as any).user
    if (user.role !== 'ADMIN' && document.department !== user.department) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Read file
    const filePath = path.join(process.cwd(), document.filePath)
    const fileBuffer = await readFile(filePath)

    // Create archive report for document access
    await createArchiveReport(
      document.id,
      document.department || 'Unknown',
      'VIEWED',
      user.id,
      'Document downloaded',
      `Document '${document.title}' was downloaded by ${user.firstName} ${user.lastName}`
    )

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', document.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`)
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Download document error:', error)
    return NextResponse.json(
      { error: 'File not found or internal server error' },
      { status: 500 }
    )
  }
})
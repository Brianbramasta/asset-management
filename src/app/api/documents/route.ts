import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { logActivity } from '@/lib/audit'
import { saveFile, isValidFileType, ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE } from '@/lib/upload'
import { compressFile, applyWatermark, formatFileSize } from '@/lib/compression'

// Upload document
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    const department = formData.get('department') as string
    const watermark = formData.get('watermark') as string
    const tags = formData.get('tags') as string
    const expiryDate = formData.get('expiryDate') as string

    if (!file || !title || !category) {
      return NextResponse.json(
        { error: 'File, title, and category are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidFileType(file.name, ALLOWED_DOCUMENT_TYPES)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Save file
    const filePath = await saveFile(file, 'documents')

    // Apply smart compression
    const compressionResult = await compressFile(filePath, file.name)
    console.log('📊 Compression completed:', {
      original: formatFileSize(compressionResult.originalSize),
      compressed: formatFileSize(compressionResult.compressedSize),
      savings: `${compressionResult.savingsPercent}%`,
      type: compressionResult.compressionType
    })

    // Map category name to DocumentCategory enum
    const categoryMapping: { [key: string]: string } = {
      'Policy Documents': 'POLICY',
      'Procedure Documents': 'PROCEDURE', 
      'Work Instructions': 'WORK_INSTRUCTION',
      'Forms': 'FORM',
      'Records': 'RECORD',
      'Manual Documents': 'MANUAL',
      'Certificates': 'CERTIFICATE',
      'Contracts': 'CONTRACT',
      'Correspondence': 'CORRESPONDENCE',
      // Legacy categories mapping
      'Surat Cuti': 'FORM',
      'Perjanjian Kerja Sama': 'CONTRACT',
      'Policy Documents': 'POLICY',
      'Procedures': 'PROCEDURE',
    }
    
    // Find the enum value for the category or default to OTHER
    const documentCategory = categoryMapping[category] || 'OTHER'
    // Apply watermark if configured for department
    let watermarkApplied = false
    if (department) {
      try {
        const watermarkConfig = await prisma.watermarkConfig.findUnique({
          where: { department }
        })
        
        if (watermarkConfig && watermarkConfig.isActive) {
          const watermarkResult = await applyWatermark(
            filePath, 
            file.name, 
            watermarkConfig.text,
            {
              position: watermarkConfig.position,
              opacity: watermarkConfig.opacity,
              fontSize: watermarkConfig.fontSize,
              color: watermarkConfig.color
            }
          )
          watermarkApplied = watermarkResult.success
          console.log('🔖 Watermark application:', watermarkApplied ? 'Success' : 'Failed')
        }
      } catch (error) {
        console.error('Watermark application error:', error)
      }
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description,
        category: documentCategory as any,
        subcategory,
        department: department || (request as any).user.department,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        watermark,
        tags,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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

    // Create archive report entry
    await prisma.archiveReport.create({
      data: {
        documentId: document.id,
        department: department || (request as any).user.department || 'Unknown',
        action: 'IN',
        performedBy: (request as any).user.id,
        reason: 'Document uploaded',
        notes: `Document '${title}' uploaded to archive`,
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
      'Document',
      document.id,
      null,
      { 
        title, 
        category, 
        fileName: file.name, 
        compressionSavings: `${compressionResult.savingsPercent}%`,
        watermarkApplied 
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      document,
      message: 'Document uploaded successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Get documents
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const department = searchParams.get('department') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit
    const user = (request as any).user

    const where = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { fileName: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {},
        category ? { category: category as any } : {},
        // Department-based filtering: Users can only see their department's documents (except ADMIN)
        user.role === 'ADMIN' 
          ? (department ? { department } : {}) 
          : { department: user.department || '' },
        isActive !== null ? { isActive: isActive === 'true' } : {},
      ],
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
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
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
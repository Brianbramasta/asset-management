import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import jwt from 'jsonwebtoken'
// Note: For now we'll skip image compression to avoid adding new dependencies
// import sharp from 'sharp'

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

// Helper function to compress image (simplified version without sharp)
async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // For now, just return the original buffer
    // In future, we can add image compression with sharp or similar library
    return buffer
  } catch (error) {
    console.error('Failed to compress image:', error)
    // Return original buffer if compression fails
    return buffer
  }
}

// POST /api/digital-assets/upload - Upload and compress preview file
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (allow images and common design files)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `preview_${timestamp}_${randomStr}.${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'digital-assets')
    
    try {
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Compress the file if it's an image
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      buffer = await compressImage(buffer, file.type)
    }

    // Save file
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Return file info
    const fileInfo = {
      fileName: fileName,
      originalName: file.name,
      size: buffer.length,
      mimeType: file.type,
      path: `/uploads/digital-assets/${fileName}`,
    }

    return NextResponse.json({ 
      success: true, 
      file: fileInfo 
    })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
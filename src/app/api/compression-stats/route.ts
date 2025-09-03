import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/middleware'
import { getFileCompressionType, getCompressionConfig, formatFileSize } from '@/lib/compression'
import path from 'path'

// Get real compression statistics (Admin only)
export const GET = withRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    // Get all documents from database
    const documents = await prisma.document.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    })

    // Calculate compression statistics
    let totalFiles = documents.length
    let totalOriginalSize = 0
    let totalCompressedSize = 0
    let compressionByType: { [key: string]: {
      count: number,
      originalSize: number,
      compressedSize: number,
      savings: number
    }} = {}

    // Process each document
    documents.forEach(doc => {
      const compressionType = getFileCompressionType(doc.fileName)
      const config = getCompressionConfig(compressionType)
      const originalSize = doc.fileSize
      const compressedSize = Math.floor(originalSize * (1 - config.compressionRate))
      
      totalOriginalSize += originalSize
      totalCompressedSize += compressedSize

      // Get friendly name for compression type
      const friendlyName = getFriendlyCompressionTypeName(compressionType)
      
      if (!compressionByType[friendlyName]) {
        compressionByType[friendlyName] = {
          count: 0,
          originalSize: 0,
          compressedSize: 0,
          savings: 0
        }
      }

      compressionByType[friendlyName].count++
      compressionByType[friendlyName].originalSize += originalSize
      compressionByType[friendlyName].compressedSize += compressedSize
    })

    // Calculate savings percentages
    Object.keys(compressionByType).forEach(type => {
      const data = compressionByType[type]
      const savings = data.originalSize > 0 
        ? Math.round(((data.originalSize - data.compressedSize) / data.originalSize) * 100)
        : 0
      compressionByType[type].savings = savings
    })

    const totalSavings = totalOriginalSize - totalCompressedSize
    const averageCompressionRate = totalOriginalSize > 0 
      ? Math.round((totalSavings / totalOriginalSize) * 100)
      : 0

    const stats = {
      totalFiles,
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRate,
      compressionByType,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Get compression stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

function getFriendlyCompressionTypeName(type: string): string {
  const mapping = {
    'MODERN_OFFICE': 'Modern Office Files',
    'LEGACY_OFFICE': 'Legacy Office Files', 
    'TEXT_FILES': 'Text Files',
    'PDF_FILES': 'PDF Files',
    'DEFAULT': 'Other Files'
  }
  return mapping[type as keyof typeof mapping] || 'Other Files'
}
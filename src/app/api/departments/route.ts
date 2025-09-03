import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// Get departments for dropdown usage
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const departments = await prisma.category.findMany({
      where: { 
        type: 'DEPARTMENT',
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
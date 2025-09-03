import { prisma } from '@/lib/prisma'

export async function createArchiveReport(
  documentId: string,
  department: string,
  action: 'IN' | 'OUT' | 'UPDATED' | 'DELETED' | 'VIEWED' | 'SHARED',
  performedBy: string,
  reason?: string,
  notes?: string
) {
  try {
    await prisma.archiveReport.create({
      data: {
        documentId,
        department,
        action,
        performedBy,
        reason,
        notes,
      },
    })
  } catch (error) {
    console.error('Failed to create archive report:', error)
  }
}

export async function getDocumentDepartment(documentId: string): Promise<string | null> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { department: true },
    })
    return document?.department || null
  } catch (error) {
    console.error('Failed to get document department:', error)
    return null
  }
}
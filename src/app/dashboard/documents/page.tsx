'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Search, Filter, Eye, Download, Edit, Trash2 } from 'lucide-react'
import { ActionsDropdown, documentActions } from '@/components/ui/actions-dropdown'
import DocumentDetailModal from '@/components/ui/document-detail-modal'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface Document {
  id: string
  title: string
  description?: string
  category: string
  subcategory?: string
  fileName: string
  fileSize: number
  mimeType: string
  version: string
  expiryDate?: string
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
}

interface ApiResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function DocumentsPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  
  // Modal states
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null as Document | null, loading: false })

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/documents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: ApiResponse = await response.json()
        setDocuments(data.documents)
        setTotalPages(data.pagination.pages)
        setTotalDocuments(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      POLICY: 'bg-[#187F7E]/10 text-[#187F7E]',
      PROCEDURE: 'bg-blue-100 text-blue-800',
      WORK_INSTRUCTION: 'bg-green-100 text-green-800',
      FORM: 'bg-yellow-100 text-yellow-800',
      RECORD: 'bg-orange-100 text-orange-800',
      MANUAL: 'bg-indigo-100 text-indigo-800',
      CERTIFICATE: 'bg-pink-100 text-pink-800',
      CONTRACT: 'bg-red-100 text-red-800',
      CORRESPONDENCE: 'bg-teal-100 text-teal-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryText = (category: string) => {
    const translations = {
      POLICY: 'Kebijakan',
      PROCEDURE: 'Prosedur',
      WORK_INSTRUCTION: 'Instruksi Kerja',
      FORM: 'Formulir',
      RECORD: 'Catatan',
      MANUAL: 'Manual',
      CERTIFICATE: 'Sertifikat',
      CONTRACT: 'Kontrak',
      CORRESPONDENCE: 'Korespondensi',
      OTHER: 'Lainnya',
    }
    return translations[category as keyof typeof translations] || category.replace('_', ' ')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  const handleViewDocument = (id: string) => {
    setSelectedDocumentId(id)
    setShowDetailModal(true)
  }

  const handleEditDocument = (id: string) => {
    router.push(`/dashboard/documents/${id}/edit`)
  }

  const handleShareDocument = async (id: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresIn: 72 }), // 3 days
      })

      if (response.ok) {
        const data = await response.json()
        // Copy to clipboard
        navigator.clipboard.writeText(data.shareUrl)
        alert(`Link berbagi berhasil dibuat dan disalin ke clipboard!\nLink akan kedaluwarsa pada: ${new Date(data.expiresAt).toLocaleString('id-ID')}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal membuat link berbagi')
      }
    } catch (error) {
      console.error('Error sharing document:', error)
      alert('Gagal membuat link berbagi')
    }
  }

  const handleArchiveDocument = async (id: string) => {
    const reason = prompt('Alasan mengarsipkan dokumen:')
    if (reason === null) return // User cancelled
    
    try {
      const response = await fetch(`/api/documents/${id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        fetchDocuments()
        alert('Dokumen berhasil diarsipkan')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal mengarsipkan dokumen')
      }
    } catch (error) {
      console.error('Error archiving document:', error)
      alert('Gagal mengarsipkan dokumen')
    }
  }

  const handleDeleteDocument = (document: Document) => {
    setDeleteModal({ isOpen: true, document, loading: false })
  }

  const confirmDeleteDocument = async () => {
    if (!deleteModal.document) return
    
    setDeleteModal(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/documents/${deleteModal.document!.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        fetchDocuments()
        setDeleteModal({ isOpen: false, document: null, loading: false })
        alert('Dokumen berhasil dihapus')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal menghapus dokumen')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Gagal menghapus dokumen')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arsip Dokumen</h1>
          <p className="text-gray-600">Kelola dokumen perusahaan Anda mengikuti standar ISO</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => router.push('/dashboard/documents/upload')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Unggah Dokumen
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Kategori
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Dokumen ({totalDocuments})
          </CardTitle>
          <CardDescription>
            Menampilkan {documents.length} dari {totalDocuments} dokumen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada dokumen ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                <div className="col-span-4">Dokumen</div>
                <div className="col-span-2">Kategori</div>
                <div className="col-span-2">Ukuran</div>
                <div className="col-span-2">Dibuat</div>
                <div className="col-span-2">Aksi</div>
              </div>

              {/* Table Body */}
              {documents.map((document) => (
                <div key={document.id} className="grid grid-cols-12 gap-4 px-4 py-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="col-span-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{document.title}</h3>
                        <p className="text-sm text-gray-500">{document.fileName}</p>
                        {document.description && (
                          <p className="text-xs text-gray-400 mt-1">{document.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">v{document.version}</span>
                          {document.expiryDate && (
                            <span className="text-xs text-orange-600">
                              Kedaluwarsa: {formatDate(document.expiryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(document.category)}`}>
                      {getCategoryText(document.category)}
                    </span>
                    {document.subcategory && (
                      <p className="text-sm text-gray-500 mt-1">{document.subcategory}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-900">{formatFileSize(document.fileSize)}</p>
                    <p className="text-sm text-gray-500">{document.mimeType}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-900">{formatDate(document.createdAt)}</p>
                    <p className="text-sm text-gray-500">
                      oleh {document.createdBy.firstName} {document.createdBy.lastName}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <ActionsDropdown 
                      items={documentActions(
                        document,
                        handleViewDocument,
                        handleEditDocument,
                        handleDownload,
                        handleShareDocument,
                        handleArchiveDocument,
                        handleDeleteDocument
                      )}
                    />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DocumentDetailModal
        documentId={selectedDocumentId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedDocumentId(null)
        }}
        onEdit={handleEditDocument}
        onDownload={handleDownload}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, document: null, loading: false })}
        onConfirm={confirmDeleteDocument}
        title="Hapus Dokumen"
        message="Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan."
        itemName={deleteModal.document?.title}
        loading={deleteModal.loading}
      />
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Download, 
  AlertTriangle,
  Clock,
  Hash,
  Database
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface DocumentDetailModalProps {
  documentId: string | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (id: string) => void
  onDownload?: (id: string, fileName: string) => void
}

interface Document {
  id: string
  title: string
  description?: string
  category: string
  subcategory?: string
  department?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: string
  tags?: string
  watermark?: string
  isActive: boolean
  expiryDate?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  updatedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function DocumentDetailModal({ 
  documentId, 
  isOpen, 
  onClose, 
  onEdit, 
  onDownload 
}: DocumentDetailModalProps) {
  const { token } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (documentId && isOpen) {
      fetchDocumentDetails()
    }
  }, [documentId, isOpen])

  const fetchDocumentDetails = async () => {
    if (!documentId || !token) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
      } else {
        console.error('Failed to fetch document details')
      }
    } catch (error) {
      console.error('Error fetching document details:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return []
    try {
      return JSON.parse(tagsString)
    } catch {
      return tagsString.split(',').map(tag => tag.trim())
    }
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="w-6 h-6 mr-2 text-green-600" />
            Detail Dokumen
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !document ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Dokumen tidak ditemukan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h2>
                  <p className="text-gray-600 mb-4">{document.description || 'Tidak ada deskripsi'}</p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={getCategoryBadge(document.category)}>
                      {getCategoryText(document.category)}
                    </Badge>
                    {document.subcategory && (
                      <Badge variant="outline">{document.subcategory}</Badge>
                    )}
                    <Badge variant={document.isActive ? 'default' : 'secondary'}>
                      {document.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                    {document.expiryDate && isExpired(document.expiryDate) && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Kedaluwarsa
                      </Badge>
                    )}
                    {document.expiryDate && isExpiringSoon(document.expiryDate) && !isExpired(document.expiryDate) && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Akan Kedaluwarsa
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {onDownload && (
                    <Button 
                      onClick={() => onDownload(document.id, document.fileName)}
                      className="bg-[#187F7E] hover:bg-[#00AAA8]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Unduh
                    </Button>
                  )}
                  {onEdit && (
                    <Button 
                      onClick={() => onEdit(document.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Edit Dokumen
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi File</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nama File</p>
                      <p className="text-sm text-gray-600">{document.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Database className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ukuran & Tipe</p>
                      <p className="text-sm text-gray-600">{formatFileSize(document.fileSize)} • {document.mimeType}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Versi</p>
                      <p className="text-sm text-gray-600">{document.version}</p>
                    </div>
                  </div>

                  {document.department && (
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Departemen</p>
                        <p className="text-sm text-gray-600">{document.department}</p>
                      </div>
                    </div>
                  )}

                  {document.expiryDate && (
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tanggal Kedaluwarsa</p>
                        <p className={`text-sm ${isExpired(document.expiryDate) ? 'text-red-600' : 
                          isExpiringSoon(document.expiryDate) ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {formatDateShort(document.expiryDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Creation & Update Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Riwayat Dokumen</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dibuat Oleh</p>
                      <p className="text-sm text-gray-600">
                        {document.createdBy.firstName} {document.createdBy.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{document.createdBy.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tanggal Dibuat</p>
                      <p className="text-sm text-gray-600">{formatDate(document.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Terakhir Diubah Oleh</p>
                      <p className="text-sm text-gray-600">
                        {document.updatedBy.firstName} {document.updatedBy.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{document.updatedBy.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Terakhir Diubah</p>
                      <p className="text-sm text-gray-600">{formatDate(document.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags and Watermark */}
            {(document.tags || document.watermark) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Tambahan</h3>
                
                {document.tags && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {parseTags(document.tags).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {document.watermark && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Watermark</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md font-mono">
                      {document.watermark}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
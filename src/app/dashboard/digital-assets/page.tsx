'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  Palette,
  ExternalLink,
  Download,
  Calendar,
  User,
  FileImage,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DigitalAsset {
  id: string
  contentName: string
  description?: string
  aspectRatio: 'RATIO_4_3' | 'RATIO_9_16'
  googleDriveLink?: string
  previewFile?: string
  previewFileName?: string
  previewFileSize?: number
  tags?: string
  department?: string
  isActive: boolean
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

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function DigitalAssetsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [aspectRatioFilter, setAspectRatioFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })
  const [selectedAsset, setSelectedAsset] = useState<DigitalAsset | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [userPermissions, setUserPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false
  })

  useEffect(() => {
    fetchDigitalAssets()
    fetchUserPermissions()
  }, [pagination.page, searchTerm, aspectRatioFilter, token])

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/digital-assets', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions)
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error)
    }
  }

  const fetchDigitalAssets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(aspectRatioFilter && aspectRatioFilter !== 'all' && { aspectRatio: aspectRatioFilter }),
      })
      
      const response = await fetch(`/api/digital-assets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch digital assets: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDigitalAssets(data.digitalAssets)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch digital assets:', error)
      toast({
        title: 'Error',
        description: `Gagal memuat aset digital: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aset digital ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/digital-assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to delete digital asset')
      }

      toast({
        title: 'Berhasil',
        description: 'Aset digital berhasil dihapus',
      })

      fetchDigitalAssets()
    } catch (error) {
      console.error('Failed to delete digital asset:', error)
      toast({
        title: 'Error',
        description: 'Gagal menghapus aset digital',
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatAspectRatio = (ratio: string) => {
    return ratio === 'RATIO_4_3' ? '4:3' : '9:16'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const parseTags = (tags?: string) => {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }
  }

  if (loading && digitalAssets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Palette className="mr-3 h-8 w-8 text-[#187F7E]" />
            Aset Digital
          </h1>
          <p className="text-gray-600 mt-1">
            Database file design untuk kebutuhan kreatif perusahaan
          </p>
        </div>
        {userPermissions.canWrite && (
          <Button 
            onClick={() => window.location.href = '/dashboard/digital-assets/new'}
            className="bg-[#187F7E] hover:bg-[#00AAA8] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Aset Digital
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cari Konten
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Nama konten, deskripsi, tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rasio Aspek
              </label>
              <Select value={aspectRatioFilter} onValueChange={setAspectRatioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua rasio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua rasio</SelectItem>
                  <SelectItem value="RATIO_4_3">4:3</SelectItem>
                  <SelectItem value="RATIO_9_16">9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setAspectRatioFilter('all')
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital Assets Grid */}
      {digitalAssets.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileImage className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada aset digital</h3>
            <p className="text-gray-600 text-center mb-4">
              Mulai menambahkan file design untuk membangun database kreatif perusahaan
            </p>
            {userPermissions.canWrite && (
              <Button 
                onClick={() => window.location.href = '/dashboard/digital-assets/new'}
                className="bg-[#187F7E] hover:bg-[#00AAA8] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Aset Digital Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {digitalAssets.map((asset: any) => (
              <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Asset Preview */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center">
                    {asset.previewFile ? (
                      <img 
                        src={asset.previewFile.startsWith('data:') ? asset.previewFile : `data:image/jpeg;base64,${asset.previewFile}`} 
                        alt={asset.contentName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Preview tidak tersedia</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Asset Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                        {asset.contentName}
                      </h3>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                        {formatAspectRatio(asset.aspectRatio)}
                      </span>
                    </div>
                    
                    {asset.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {asset.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {asset.tags && parseTags(asset.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {parseTags(asset.tags).slice(0, 3).map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        {parseTags(asset.tags).length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                            +{parseTags(asset.tags).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Meta Info */}
                    <div className="space-y-1 text-xs text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>Dibuat oleh:</span>
                        <span className="font-medium">
                          {asset.createdBy.firstName} {asset.createdBy.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{formatDate(asset.createdAt)}</span>
                      </div>
                      {asset.department && (
                        <div className="flex justify-between">
                          <span>Departemen:</span>
                          <span className="font-medium">{asset.department}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      {asset.googleDriveLink && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(asset.googleDriveLink, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Lihat File
                        </Button>
                      )}
                      {userPermissions.canWrite && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `/dashboard/digital-assets/${asset.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {userPermissions.canDelete && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  if (pagination.page > 1) {
                    const newSearchParams = new URLSearchParams()
                    newSearchParams.set('page', (pagination.page - 1).toString())
                    fetchDigitalAssets()
                  }
                }}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              
              <span className="text-sm text-gray-600">
                Halaman {pagination.page} dari {pagination.pages} 
                ({pagination.total} total aset)
              </span>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (pagination.page < pagination.pages) {
                    const newSearchParams = new URLSearchParams()
                    newSearchParams.set('page', (pagination.page + 1).toString())
                    fetchDigitalAssets()
                  }
                }}
                disabled={pagination.page >= pagination.pages}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
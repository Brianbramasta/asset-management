'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload } from 'lucide-react'
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

export default function EditDigitalAssetPage() {
  const router = useRouter()
  const params = useParams()
  const { user, token } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [asset, setAsset] = useState<DigitalAsset | null>(null)
  const [formData, setFormData] = useState({
    contentName: '',
    description: '',
    aspectRatio: 'RATIO_4_3',
    googleDriveLink: '',
    tags: '',
  })

  const [userPermissions, setUserPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false
  })

  useEffect(() => {
    fetchAsset()
    fetchUserPermissions()
  }, [params.id, token])

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/digital-assets', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions)
        
        if (!data.permissions.canWrite) {
          toast({
            title: 'Akses Ditolak',
            description: 'Anda tidak memiliki izin untuk mengedit aset digital',
            variant: 'destructive',
          })
          router.push('/dashboard/digital-assets')
        }
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error)
    }
  }

  const fetchAsset = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/digital-assets/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch digital asset')
      }

      const data = await response.json()
      setAsset(data.digitalAsset)
      
      // Parse tags back to string format
      let tagsString = ''
      if (data.digitalAsset.tags) {
        try {
          const parsedTags = JSON.parse(data.digitalAsset.tags)
          tagsString = Array.isArray(parsedTags) ? parsedTags.join(', ') : data.digitalAsset.tags
        } catch {
          tagsString = data.digitalAsset.tags
        }
      }
      
      setFormData({
        contentName: data.digitalAsset.contentName || '',
        description: data.digitalAsset.description || '',
        aspectRatio: data.digitalAsset.aspectRatio || 'RATIO_4_3',
        googleDriveLink: data.digitalAsset.googleDriveLink || '',
        tags: tagsString,
      })
    } catch (error) {
      console.error('Failed to fetch digital asset:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat aset digital',
        variant: 'destructive',
      })
      router.push('/dashboard/digital-assets')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contentName.trim()) {
      toast({
        title: 'Error',
        description: 'Nama konten harus diisi',
        variant: 'destructive',
      })
      return
    }

    if (!userPermissions.canWrite) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengedit aset digital',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)

      const response = await fetch(`/api/digital-assets/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: JSON.stringify(tagsArray),
          department: asset?.department, // Keep existing department
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update digital asset')
      }

      toast({
        title: 'Berhasil',
        description: 'Aset digital berhasil diperbarui',
      })

      router.push('/dashboard/digital-assets')
    } catch (error: any) {
      console.error('Failed to update digital asset:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui aset digital',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aset digital tidak ditemukan</h3>
        <Button onClick={() => router.push('/dashboard/digital-assets')}>
          Kembali ke Daftar Aset Digital
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Aset Digital</h1>
          <p className="text-gray-600 mt-1">
            Perbarui informasi aset digital
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Aset Digital</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Content Name */}
              <div className="space-y-2">
                <Label htmlFor="contentName">
                  Nama Konten <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contentName"
                  value={formData.contentName}
                  onChange={(e) => handleInputChange('contentName', e.target.value)}
                  placeholder="Masukkan nama konten"
                  required
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Rasio Aspek</Label>
                <Select
                  value={formData.aspectRatio}
                  onValueChange={(value) => handleInputChange('aspectRatio', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RATIO_4_3">4:3</SelectItem>
                    <SelectItem value="RATIO_9_16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Masukkan deskripsi aset digital"
                rows={4}
              />
            </div>

            {/* Google Drive Link */}
            <div className="space-y-2">
              <Label htmlFor="googleDriveLink">Link Google Drive</Label>
              <Input
                id="googleDriveLink"
                type="url"
                value={formData.googleDriveLink}
                onChange={(e) => handleInputChange('googleDriveLink', e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="Pisahkan dengan koma, contoh: logo, branding, marketing"
              />
              <p className="text-sm text-gray-500">
                Pisahkan tag dengan koma untuk memudahkan pencarian
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !userPermissions.canWrite}
                className="bg-[#187F7E] hover:bg-[#00AAA8] text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
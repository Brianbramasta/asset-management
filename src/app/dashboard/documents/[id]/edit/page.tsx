'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, FileText, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Document {
  id: string
  title: string
  description?: string
  category: string
  subcategory?: string
  department?: string
  fileName: string
  fileSize: number
  mimeType: string
  version: string
  tags?: string
  watermark?: string
  isActive: boolean
  expiryDate?: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  type: string
  isActive: boolean
}

export default function EditDocumentPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    department: '',
    watermark: '',
    tags: '',
    expiryDate: '',
    isActive: true,
  })

  useEffect(() => {
    fetchDocument()
    fetchCategories()
    fetchDepartments()
  }, [])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const doc = data.document
        setDocument(doc)
        
        // Format tags for display
        let tagsString = ''
        if (doc.tags) {
          try {
            const tagsArray = JSON.parse(doc.tags)
            tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : doc.tags
          } catch {
            tagsString = doc.tags
          }
        }

        setFormData({
          title: doc.title || '',
          description: doc.description || '',
          category: doc.category || '',
          subcategory: doc.subcategory || '',
          department: doc.department || '',
          watermark: doc.watermark || '',
          tags: tagsString,
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
          isActive: doc.isActive,
        })
      } else {
        router.push('/dashboard/documents')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      router.push('/dashboard/documents')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=DOCUMENT', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories?.filter((cat: Category) => cat.isActive) || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Process tags
      let tagsToSave = null
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        tagsToSave = JSON.stringify(tagsArray)
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        department: formData.department,
        watermark: formData.watermark,
        tags: tagsToSave,
        expiryDate: formData.expiryDate || null,
        isActive: formData.isActive,
      }

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        alert('Dokumen berhasil diperbarui')
        router.push('/dashboard/documents')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal memperbarui dokumen')
      }
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Gagal memperbarui dokumen')
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-8">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dokumen Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-4">Dokumen yang Anda cari tidak ditemukan atau telah dihapus.</p>
        <Button onClick={() => router.push('/dashboard/documents')}>
          Kembali ke Daftar Dokumen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/documents')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Dokumen</h1>
            <p className="text-gray-600">Ubah informasi dokumen</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informasi Dokumen
              </CardTitle>
              <CardDescription>
                Ubah detail dan metadata dokumen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Judul Dokumen *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategori *</Label>
                    <Select value={formData.category} onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subcategory">Sub Kategori</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    />
                  </div>

                  {user?.role === 'ADMIN' && (
                    <div>
                      <Label htmlFor="department">Departemen</Label>
                      <Select value={formData.department} onValueChange={(value: string) => setFormData(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih departemen" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="expiryDate">Tanggal Kedaluwarsa</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="Pisahkan dengan koma (contoh: urgent, confidential, policy)"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Gunakan koma untuk memisahkan multiple tags
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="watermark">Custom Watermark</Label>
                    <Input
                      id="watermark"
                      placeholder="Teks watermark untuk dokumen ini"
                      value={formData.watermark}
                      onChange={(e) => setFormData(prev => ({ ...prev, watermark: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Dokumen Aktif</Label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push('/dashboard/documents')}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Document Info Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informasi File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nama File</Label>
                <p className="text-sm text-gray-600 break-all">{document.fileName}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Ukuran File</Label>
                <p className="text-sm text-gray-600">{formatFileSize(document.fileSize)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Tipe File</Label>
                <p className="text-sm text-gray-600">{document.mimeType}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Versi</Label>
                <p className="text-sm text-gray-600">{document.version}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Dibuat</Label>
                <p className="text-sm text-gray-600">
                  {new Date(document.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Terakhir Diubah</Label>
                <p className="text-sm text-gray-600">
                  {new Date(document.updatedAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
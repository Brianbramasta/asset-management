'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, ArrowLeft, Upload, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: string
  isActive: boolean
}

export default function UploadDocumentPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    tags: '',
    expiryDate: '',
    hasExpiryDate: false,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
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
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Silakan pilih file dokumen yang valid (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)')
        return
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file harus kurang dari 10MB')
        return
      }
      
      setSelectedFile(file)
      
      // Auto-fill title if empty
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        setFormData(prev => ({ ...prev, title: fileName }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      alert('Silakan pilih file untuk diunggah')
      return
    }
    
    setLoading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('category', formData.category)
      uploadFormData.append('subcategory', formData.subcategory)
      uploadFormData.append('tags', formData.tags)
      uploadFormData.append('expiryDate', formData.hasExpiryDate ? formData.expiryDate : '')

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (response.ok) {
        router.push('/dashboard/documents')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal mengunggah dokumen')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Gagal mengunggah dokumen')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'hasExpiryDate') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unggah Dokumen</h1>
            <p className="text-gray-600">Tambahkan dokumen baru ke arsip</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Informasi Dokumen
                </CardTitle>
                <CardDescription>
                  Informasi dasar tentang dokumen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Dokumen *
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Masukkan judul dokumen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Deskripsikan konten dokumen"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori *
                    </label>
                    {categoriesLoading ? (
                      <div className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        <span className="text-sm text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <Select value={formData.category} onValueChange={(value: string) => handleChange('category', value)}>
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
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subkategori
                    </label>
                    <Input
                      value={formData.subcategory}
                      onChange={(e) => handleChange('subcategory', e.target.value)}
                      placeholder="mis., Manual Mutu, Kebijakan Keselamatan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tag
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      placeholder="Tag dipisahkan koma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Kedaluwarsa
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasExpiryDate"
                          checked={formData.hasExpiryDate}
                          onChange={(e) => {
                            handleChange('hasExpiryDate', e.target.checked.toString())
                            if (!e.target.checked) {
                              handleChange('expiryDate', '')
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="hasExpiryDate" className="text-sm text-gray-700">
                          Dokumen memiliki tanggal kedaluwarsa
                        </label>
                      </div>
                      {formData.hasExpiryDate && (
                        <Input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => handleChange('expiryDate', e.target.value)}
                          className="w-full"
                        />
                      )}
                      {!formData.hasExpiryDate && (
                        <p className="text-xs text-gray-500">
                          Dokumen ini tidak akan memiliki tanggal kedaluwarsa
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File Upload */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Unggah File</CardTitle>
                <CardDescription>
                  Pilih file dokumen untuk diunggah
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Klik untuk mengunggah atau seret dan lepas
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (maks 10MB)
                      </span>
                    </label>
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p className="font-medium mb-1">Format yang didukung:</p>
                  <ul className="space-y-1">
                    <li>• Dokumen PDF</li>
                    <li>• File Microsoft Office</li>
                    <li>• Ukuran file maksimal: 10MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading || !selectedFile}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? 'Mengunggah...' : 'Unggah Dokumen'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Upload, X, FileImage } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function NewDigitalAssetPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [formData, setFormData] = useState({
    contentName: '',
    description: '',
    aspectRatio: 'RATIO_4_3',
    googleDriveLink: '',
    tags: '',
    previewFile: null as File | null,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Enhanced image compression function with target file size
  const compressImage = (file: File, targetSizeKB: number = 500): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Start with reasonable dimensions and quality
        let maxWidth = 1200
        let quality = 0.9
        let attempts = 0
        const maxAttempts = 10
        
        const tryCompress = () => {
          // Calculate new dimensions maintaining aspect ratio
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          // Clear canvas and draw image
          ctx?.clearRect(0, 0, canvas.width, canvas.height)
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileSizeKB = blob.size / 1024
                
                // If file size is acceptable or we've tried enough times
                if (fileSizeKB <= targetSizeKB || attempts >= maxAttempts) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                  resolve(compressedFile)
                } else {
                  // File still too large, reduce quality and/or dimensions
                  attempts++
                  
                  if (quality > 0.3) {
                    // Reduce quality first
                    quality -= 0.1
                  } else {
                    // If quality is already low, reduce dimensions
                    maxWidth = Math.max(400, maxWidth * 0.8)
                    quality = 0.7 // Reset quality when reducing dimensions
                  }
                  
                  // Try again with new settings
                  setTimeout(tryCompress, 10)
                }
              }
            },
            'image/jpeg',
            quality
          )
        }
        
        // Start compression attempts
        tryCompress()
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Hanya file gambar yang diperbolehkan',
        variant: 'destructive',
      })
      return
    }

    // Check file size (max 20MB for original file, will be compressed to 500KB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 20MB',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploading(true)
      
      // Compress image
      const compressedFile = await compressImage(file)
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreviewImage(previewUrl)
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        previewFile: compressedFile
      }))
      
      toast({
        title: 'Berhasil',
        description: `File berhasil dikompres dari ${(file.size / 1024 / 1024).toFixed(2)}MB menjadi ${(compressedFile.size / 1024).toFixed(0)}KB (target: max 500KB)`,
      })
    } catch (error) {
      console.error('Error compressing image:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengompres gambar',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  // Remove uploaded file
  const handleRemoveFile = () => {
    setPreviewImage(null)
    setFormData(prev => ({
      ...prev,
      previewFile: null
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      // Simulate file input change event
      const event = {
        target: { files: [file] }
      } as any
      handleFileUpload(event)
    }
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

    try {
      setLoading(true)
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)

      // Prepare form data for submission
      const submitFormData = new FormData()
      submitFormData.append('contentName', formData.contentName)
      submitFormData.append('description', formData.description)
      submitFormData.append('aspectRatio', formData.aspectRatio)
      submitFormData.append('googleDriveLink', formData.googleDriveLink)
      submitFormData.append('tags', JSON.stringify(tagsArray))
      submitFormData.append('department', user?.department || 'Digital')
      
      // Add compressed preview file if exists
      if (formData.previewFile) {
        submitFormData.append('previewFile', formData.previewFile)
      }

      const response = await fetch('/api/digital-assets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to create digital asset')
      }

      toast({
        title: 'Berhasil',
        description: 'Aset digital berhasil ditambahkan',
      })

      router.push('/dashboard/digital-assets')
    } catch (error) {
      console.error('Failed to create digital asset:', error)
      toast({
        title: 'Error',
        description: 'Gagal menambahkan aset digital',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Tambah Aset Digital</h1>
          <p className="text-gray-600 mt-1">
            Tambahkan file design baru ke dalam database kreatif perusahaan
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

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="previewFile">Upload Preview File</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDragOver 
                    ? 'border-[#187F7E] bg-[#187F7E]/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full max-w-xs h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {formData.previewFile?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ukuran: {formData.previewFile ? (formData.previewFile.size / 1024).toFixed(0) : '0'}KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mb-2"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Mengompres ke 500KB...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Pilih File
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-600">
                        atau drag & drop file disini
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, GIF hingga 20MB. File akan dikompres otomatis menjadi maksimal 500KB untuk preview.
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
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
                disabled={loading}
                className="bg-[#187F7E] hover:bg-[#00AAA8] text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Aset Digital
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

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Edit, ArrowLeft, Calendar, MapPin, User, Wrench } from 'lucide-react'

interface Asset {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  serialNumber?: string
  barcode?: string
  condition: string
  location: string
  department?: string
  assignedTo?: string
  warrantyUntil?: string
  notes?: string
  tags?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
  updatedBy?: {
    firstName: string
    lastName: string
    email: string
  }
  maintenances?: Array<{
    id: string
    type: string
    description: string
    cost?: number
    performedAt: string
    performedBy: string
  }>
  audits?: Array<{
    id: string
    condition: string
    notes?: string
    auditedAt: string
    auditedBy: {
      firstName: string
      lastName: string
    }
  }>
}

export default function AssetDetailPage() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAsset()
    }
  }, [params.id])

  const fetchAsset = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assets/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAsset(data.asset)
      } else if (response.status === 404) {
        router.push('/dashboard/assets')
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConditionBadge = (condition: string) => {
    const colors = {
      EXCELLENT: 'bg-[#187F7E]/10 text-[#187F7E]',
      GOOD: 'bg-[#00AAA8]/10 text-[#00AAA8]',
      FAIR: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-[#D4AF37]/10 text-[#D4AF37]',
      DAMAGED: 'bg-red-100 text-red-800',
      DISPOSED: 'bg-gray-100 text-gray-800',
    }
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getConditionText = (condition: string) => {
    const translations = {
      EXCELLENT: 'Sangat Baik',
      GOOD: 'Baik',
      FAIR: 'Cukup',
      POOR: 'Buruk',
      DAMAGED: 'Rusak',
      DISPOSED: 'Dibuang',
    }
    return translations[condition as keyof typeof translations] || condition
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Not Found</h2>
          <p className="text-gray-600">The asset you're looking for doesn't exist.</p>
        </div>
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
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600">{asset.brand} {asset.model}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => router.push(`/dashboard/assets/${asset.id}/edit`)}
            className="bg-[#187F7E] hover:bg-[#00AAA8]"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Asset Name</label>
                  <p className="text-sm text-gray-900">{asset.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">{asset.category}</p>
                </div>
                {asset.subcategory && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subcategory</label>
                    <p className="text-sm text-gray-900">{asset.subcategory}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Condition</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConditionBadge(asset.condition)}`}>
                    {getConditionText(asset.condition)}
                  </span>
                </div>
                {asset.serialNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serial Number</label>
                    <p className="text-sm text-gray-900 font-mono">{asset.serialNumber}</p>
                  </div>
                )}
                {asset.barcode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barcode</label>
                    <p className="text-sm text-gray-900 font-mono">{asset.barcode}</p>
                  </div>
                )}
              </div>
              {asset.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm text-gray-900">{asset.location}</p>
                </div>
                {asset.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-sm text-gray-900">{asset.department}</p>
                  </div>
                )}
                {asset.assignedTo && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="text-sm text-gray-900">{asset.assignedTo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes & Tags */}
          {(asset.notes || asset.tags) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900">{asset.notes}</p>
                  </div>
                )}
                {asset.tags && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tags</label>
                    <p className="text-sm text-gray-900">{asset.tags}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Warranty Until</label>
                <p className="text-sm text-gray-900">{formatDate(asset.warrantyUntil)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{formatDate(asset.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(asset.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Created By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0EB6B4]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#187F7E] font-medium text-sm">
                    {asset.createdBy.firstName.charAt(0)}{asset.createdBy.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {asset.createdBy.firstName} {asset.createdBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{asset.createdBy.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
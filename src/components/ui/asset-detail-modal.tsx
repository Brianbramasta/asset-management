'use client'

import { useState } from 'react'
import { X, Package, MapPin, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

interface AssetDetailModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
}

export function AssetDetailModal({ asset, isOpen, onClose }: AssetDetailModalProps) {
  if (!isOpen) return null

  const getConditionBadge = (condition: string) => {
    const colors = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      FAIR: 'bg-yellow-100 text-yellow-800',
      POOR: 'bg-orange-100 text-orange-800',
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0EB6B4]/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-[#187F7E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
              <p className="text-sm text-gray-600">{asset.brand} {asset.model}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category</span>
                      <p className="text-sm text-gray-900">{asset.category}</p>
                    </div>
                    {asset.subcategory && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Subcategory</span>
                        <p className="text-sm text-gray-900">{asset.subcategory}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Condition</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConditionBadge(asset.condition)}`}>
                        {getConditionText(asset.condition)}
                      </span>
                    </div>
                  </div>
                  {asset.serialNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Serial Number</span>
                      <p className="text-sm text-gray-900 font-mono">{asset.serialNumber}</p>
                    </div>
                  )}
                  {asset.barcode && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Barcode</span>
                      <p className="text-sm text-gray-900 font-mono">{asset.barcode}</p>
                    </div>
                  )}
                  {asset.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description</span>
                      <p className="text-sm text-gray-900">{asset.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Assignment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location & Assignment
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location</span>
                    <p className="text-sm text-gray-900">{asset.location}</p>
                  </div>
                  {asset.department && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Department</span>
                      <p className="text-sm text-gray-900">{asset.department}</p>
                    </div>
                  )}
                  {asset.assignedTo && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Assigned To</span>
                      <p className="text-sm text-gray-900">{asset.assignedTo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Important Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Warranty Until</span>
                    <p className="text-sm text-gray-900">{formatDate(asset.warrantyUntil)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <p className="text-sm text-gray-900">{formatDate(asset.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Creator Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Created By
                </h3>
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
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(asset.notes || asset.tags) && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-3">
                {asset.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Notes</span>
                    <p className="text-sm text-gray-900">{asset.notes}</p>
                  </div>
                )}
                {asset.tags && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tags</span>
                    <p className="text-sm text-gray-900">{asset.tags}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { ActionsDropdown, assetActions } from '@/components/ui/actions-dropdown'
import { AssetDetailModal } from '@/components/ui/asset-detail-modal'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

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
}

interface ApiResponse {
  assets: Asset[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AssetsPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAssets, setTotalAssets] = useState(0)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    asset: Asset | null
    loading: boolean
  }>({ isOpen: false, asset: null, loading: false })

  useEffect(() => {
    fetchAssets()
  }, [currentPage, searchTerm])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/assets?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: ApiResponse = await response.json()
        setAssets(data.assets)
        setTotalPages(data.pagination.pages)
        setTotalAssets(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const handleViewAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedAsset(data.asset)
        setIsModalOpen(true)
      } else {
        alert('Asset not found')
      }
    } catch (error) {
      console.error('Error fetching asset details:', error)
      alert('Failed to load asset details')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAsset(null)
  }

  const handleEditAsset = (id: string) => {
    router.push(`/dashboard/assets/${id}/edit`)
  }

  const handleDuplicateAsset = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menduplikasi aset ini?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/assets/${id}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Refresh the assets list
        fetchAssets()
        alert(`Aset berhasil diduplikasi: ${data.asset.name}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal menduplikasi aset')
      }
    } catch (error) {
      console.error('Error duplicating asset:', error)
      alert('Gagal menduplikasi aset')
    }
  }

  const handleDeleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (asset) {
      setDeleteModal({ isOpen: true, asset, loading: false })
    }
  }

  const confirmDeleteAsset = async () => {
    if (!deleteModal.asset) return

    try {
      setDeleteModal(prev => ({ ...prev, loading: true }))
      
      const response = await fetch(`/api/assets/${deleteModal.asset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        // Refresh the assets list
        fetchAssets()
        setDeleteModal({ isOpen: false, asset: null, loading: false })
        alert('Aset berhasil dihapus')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal menghapus aset')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Gagal menghapus aset')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Kelola dan lacak aset perusahaan Anda</p>
        </div>
        <Button 
          className="bg-[#187F7E] hover:bg-[#00AAA8]"
          onClick={() => router.push('/dashboard/assets/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-200 rounded-md text-sm">
              <option>All Products</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-md text-sm">
              <option>All Status</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-md text-sm">
              <option>All Stores</option>
            </select>
          </div>
          
          <Button variant="outline" className="border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Assets List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">{totalAssets} items</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada aset ditemukan</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-10 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-4">Product Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <div key={asset.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-500">
                            {asset.brand} {asset.model}
                          </p>
                          {asset.serialNumber && (
                            <p className="text-xs text-gray-400">SN: {asset.serialNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category */}
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900">{asset.category}</p>
                    </div>
                    
                    {/* Location */}
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900">{asset.location}</p>
                    </div>
                    
                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        asset.condition === 'EXCELLENT' || asset.condition === 'GOOD' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        ● {getConditionText(asset.condition)}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-2">
                      <ActionsDropdown 
                        items={assetActions(
                          asset,
                          handleViewAsset,
                          handleEditAsset,
                          handleDuplicateAsset,
                          handleDeleteAsset
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 px-6 py-4 border-t border-gray-200">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 text-sm rounded ${
                    currentPage === pageNum
                      ? 'bg-[#187F7E] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && (
              <span className="text-gray-400">...</span>
            )}
            {totalPages > 5 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`w-8 h-8 text-sm rounded ${
                  currentPage === totalPages
                    ? 'bg-[#187F7E] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {totalPages}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, asset: null, loading: false })}
        onConfirm={confirmDeleteAsset}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        itemName={deleteModal.asset?.name}
        loading={deleteModal.loading}
      />
    </div>
  )
}
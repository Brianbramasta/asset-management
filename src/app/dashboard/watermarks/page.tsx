'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileImage, Plus, Edit, Trash2, Settings } from 'lucide-react'
import { ActionsDropdown } from '@/components/ui/actions-dropdown'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface WatermarkConfig {
  id: string
  department: string
  text: string
  opacity: number
  position: string
  fontSize: number
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface WatermarkForm {
  department: string
  text: string
  opacity: number
  position: string
  fontSize: number
  color: string
  isActive: boolean
}

export default function WatermarksPage() {
  const { token, user } = useAuth()
  const [watermarks, setWatermarks] = useState<WatermarkConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<WatermarkConfig | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    item: WatermarkConfig | null
    loading: boolean
  }>({ isOpen: false, item: null, loading: false })

  const [formData, setFormData] = useState<WatermarkForm>({
    department: '',
    text: '',
    opacity: 0.3,
    position: 'center',
    fontSize: 12,
    color: '#888888',
    isActive: true,
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchWatermarks()
    }
  }, [user])

  const fetchWatermarks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/watermarks', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setWatermarks(data.watermarks || [])
      }
    } catch (error) {
      console.error('Failed to fetch watermarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.department.trim() || !formData.text.trim()) {
      alert('Department and watermark text are required')
      return
    }

    try {
      const endpoint = editingItem 
        ? `/api/watermarks/${editingItem.department}`
        : '/api/watermarks'
      
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(`Watermark ${editingItem ? 'updated' : 'created'} successfully`)
        resetForm()
        fetchWatermarks()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${editingItem ? 'update' : 'create'} watermark`)
      }
    } catch (error) {
      console.error('Error saving watermark:', error)
      alert(`Failed to ${editingItem ? 'update' : 'create'} watermark`)
    }
  }

  const handleEdit = (item: WatermarkConfig) => {
    setEditingItem(item)
    setFormData({
      department: item.department,
      text: item.text,
      opacity: item.opacity,
      position: item.position,
      fontSize: item.fontSize,
      color: item.color,
      isActive: item.isActive,
    })
    setShowAddForm(true)
  }

  const handleDelete = (item: WatermarkConfig) => {
    setDeleteModal({ isOpen: true, item, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteModal(prev => ({ ...prev, loading: true }))
      
      const response = await fetch(`/api/watermarks/${deleteModal.item.department}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        alert('Watermark configuration deleted successfully')
        setDeleteModal({ isOpen: false, item: null, loading: false })
        fetchWatermarks()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete watermark configuration')
      }
    } catch (error) {
      console.error('Error deleting watermark:', error)
      alert('Failed to delete watermark configuration')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData({
      department: '',
      text: '',
      opacity: 0.3,
      position: 'center',
      fontSize: 12,
      color: '#888888',
      isActive: true,
    })
  }

  const watermarkActions = (item: WatermarkConfig) => [
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => handleEdit(item),
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => handleDelete(item),
      variant: 'destructive' as const,
    },
  ]

  const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ]

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage watermark configurations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Watermark Management</h1>
          <p className="text-gray-600">Configure custom watermarks for each department's documents</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-[#187F7E] hover:bg-[#00AAA8]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Watermark
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watermarks List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <FileImage className="w-5 h-5 mr-2" />
                <div>
                  <CardTitle>Watermark Configurations</CardTitle>
                  <CardDescription>Manage watermark settings for each department</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : watermarks.length === 0 ? (
                <div className="text-center py-8">
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No watermark configurations found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {watermarks.map((watermark) => (
                    <div
                      key={watermark.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{watermark.department}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            watermark.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {watermark.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">"{watermark.text}"</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Position: {watermark.position}</span>
                          <span>Opacity: {Math.round(watermark.opacity * 100)}%</span>
                          <span>Size: {watermark.fontSize}px</span>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: watermark.color }}
                            title={`Color: ${watermark.color}`}
                          />
                        </div>
                      </div>
                      <ActionsDropdown items={watermarkActions(watermark)} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingItem ? 'Edit Watermark' : 'Add New Watermark'}
                </CardTitle>
                <CardDescription>
                  {editingItem ? 'Update watermark configuration' : 'Create a new watermark configuration'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      required
                      disabled={editingItem !== null}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Watermark Text *
                    </label>
                    <Input
                      type="text"
                      value={formData.text}
                      onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                      required
                      placeholder="e.g., CONFIDENTIAL - IT Department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#187F7E]"
                    >
                      {positions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opacity
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.opacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                      </label>
                      <Input
                        type="number"
                        min="8"
                        max="48"
                        value={formData.fontSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-[#187F7E] focus:ring-[#187F7E] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active watermark
                    </label>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      className="bg-[#187F7E] hover:bg-[#00AAA8] flex-1"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, loading: false })}
        onConfirm={confirmDelete}
        title="Delete Watermark Configuration"
        message="Are you sure you want to delete this watermark configuration? This action cannot be undone."
        itemName={deleteModal.item ? `${deleteModal.item.department} - ${deleteModal.item.text}` : ''}
        loading={deleteModal.loading}
      />
    </div>
  )
}
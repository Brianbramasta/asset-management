'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Plus, Edit, Trash2, Package, FileText, Building, Shield, Key, Palette } from 'lucide-react'
import { ActionsDropdown } from '@/components/ui/actions-dropdown'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface NewCategoryForm {
  name: string
  description: string
}

interface PermissionModalProps {
  isOpen: boolean
  onClose: () => void
  department: Category | null
  permissions: any[]
  loading: boolean
  token: string | null
  onSave: () => void
}

function PermissionModal({ isOpen, onClose, department, permissions, loading, token, onSave }: PermissionModalProps) {
  const [permissionState, setPermissionState] = useState<{ [key: string]: { canRead: boolean, canWrite: boolean, canDelete: boolean } }>({})
  const [saving, setSaving] = useState(false)

  const modules = [
    { key: 'ASSETS', label: 'Assets', icon: Package },
    { key: 'DOCUMENTS', label: 'Documents', icon: FileText },
    { key: 'DIGITAL_ASSETS', label: 'Digital Assets', icon: Palette },
  ]

  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const state: { [key: string]: { canRead: boolean, canWrite: boolean, canDelete: boolean } } = {}
      permissions.forEach(perm => {
        state[perm.module] = {
          canRead: perm.canRead,
          canWrite: perm.canWrite,
          canDelete: perm.canDelete
        }
      })
      
      // Set defaults for modules that don't have permissions yet
      modules.forEach(module => {
        if (!state[module.key]) {
          state[module.key] = { canRead: true, canWrite: false, canDelete: false }
        }
      })
      
      setPermissionState(state)
    } else {
      // Default permissions
      const defaultState: { [key: string]: { canRead: boolean, canWrite: boolean, canDelete: boolean } } = {}
      modules.forEach(module => {
        defaultState[module.key] = { canRead: true, canWrite: false, canDelete: false }
      })
      setPermissionState(defaultState)
    }
  }, [permissions])

  const handlePermissionChange = (moduleKey: string, permission: 'canRead' | 'canWrite' | 'canDelete', value: boolean) => {
    setPermissionState(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permission]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!department || !token) return

    try {
      setSaving(true)
      
      // Save permissions for each module
      const promises = Object.entries(permissionState).map(([moduleKey, perms]) => {
        return fetch('/api/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            department: department.name,
            module: moduleKey,
            canRead: perms.canRead,
            canWrite: perms.canWrite,
            canDelete: perms.canDelete
          })
        })
      })

      await Promise.all(promises)
      alert('Permissions updated successfully!')
      onSave()
    } catch (error) {
      console.error('Failed to save permissions:', error)
      alert('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configure Permissions - {department?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3">Loading permissions...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Module Access Permissions</h4>
                <div className="space-y-4">
                  {modules.map((module) => {
                    const IconComponent = module.icon
                    const modulePerms = permissionState[module.key] || { canRead: true, canWrite: false, canDelete: false }
                    
                    return (
                      <div key={module.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <h5 className="font-medium text-gray-900">{module.label}</h5>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module.key}-read`}
                              checked={modulePerms.canRead}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.key, 'canRead', checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${module.key}-read`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Read
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module.key}-write`}
                              checked={modulePerms.canWrite}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.key, 'canWrite', checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${module.key}-write`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Write
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module.key}-delete`}
                              checked={modulePerms.canDelete}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.key, 'canDelete', checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${module.key}-delete`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Delete
                            </label>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#187F7E] hover:bg-[#00AAA8]"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const { token, user } = useAuth()
  const [activeTab, setActiveTab] = useState<'assets' | 'documents' | 'departments' | 'permissions'>('assets')
  const [assetCategories, setAssetCategories] = useState<Category[]>([])
  const [documentCategories, setDocumentCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Category | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    item: Category | null
    loading: boolean
  }>({ isOpen: false, item: null, loading: false })
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean
    department: Category | null
    loading: boolean
    permissions: any[]
  }>({ isOpen: false, department: null, loading: false, permissions: [] })

  const [newCategoryForm, setNewCategoryForm] = useState<NewCategoryForm>({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const [assetsRes, docsRes, deptsRes] = await Promise.all([
        fetch('/api/categories?type=ASSET', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/categories?type=DOCUMENT', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/categories?type=DEPARTMENT', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (assetsRes.ok) {
        const data = await assetsRes.json()
        setAssetCategories(data.categories || [])
      }
      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocumentCategories(data.categories || [])
      }
      if (deptsRes.ok) {
        const data = await deptsRes.json()
        setDepartments(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategoryForm.name.trim()) {
      alert('Category name is required')
      return
    }

    try {
      const categoryType = activeTab === 'assets' ? 'ASSET' : 
                          activeTab === 'documents' ? 'DOCUMENT' : 
                          'DEPARTMENT'
      
      const endpoint = editingItem 
        ? `/api/categories/${editingItem.id}`
        : `/api/categories?type=${categoryType}`
      
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategoryForm),
      })

      if (response.ok) {
        alert(`Category ${editingItem ? 'updated' : 'created'} successfully`)
        setNewCategoryForm({ name: '', description: '' })
        setShowAddForm(false)
        setEditingItem(null)
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${editingItem ? 'update' : 'create'} category`)
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert(`Failed to ${editingItem ? 'update' : 'create'} category`)
    }
  }

  const handleEdit = (item: Category) => {
    setEditingItem(item)
    setNewCategoryForm({
      name: item.name,
      description: item.description || '',
    })
    setShowAddForm(true)
  }

  const handleDelete = (item: Category) => {
    setDeleteModal({ isOpen: true, item, loading: false })
  }

  const handlePermissions = async (department: Category) => {
    try {
      setPermissionModal({ isOpen: true, department, loading: true, permissions: [] })
      
      const response = await fetch(`/api/permissions?department=${encodeURIComponent(department.name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPermissionModal(prev => ({ 
          ...prev, 
          loading: false, 
          permissions: data.permissions || [] 
        }))
      } else {
        setPermissionModal(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      setPermissionModal(prev => ({ ...prev, loading: false }))
    }
  }

  const confirmDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteModal(prev => ({ ...prev, loading: true }))
      
      const response = await fetch(`/api/categories/${deleteModal.item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        alert('Category deleted successfully')
        setDeleteModal({ isOpen: false, item: null, loading: false })
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setNewCategoryForm({ name: '', description: '' })
  }

  const getCurrentCategories = () => {
    switch (activeTab) {
      case 'assets':
        return assetCategories
      case 'documents':
        return documentCategories
      case 'departments':
        return departments
      default:
        return []
    }
  }

  const getTabConfig = (tab: string) => {
    const configs = {
      assets: {
        title: 'Asset Categories',
        icon: Package,
        description: 'Manage categories for asset classification'
      },
      documents: {
        title: 'Document Categories',
        icon: FileText,
        description: 'Manage categories for document classification'
      },
      departments: {
        title: 'Departments',
        icon: Building,
        description: 'Manage organizational departments'
      },
      permissions: {
        title: 'Permissions',
        icon: Shield,
        description: 'Manage department access permissions for different modules'
      }
    }
    return configs[tab as keyof typeof configs]
  }

  const categoryActions = (item: Category) => {
    const baseActions = [
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

    // Add permissions action only for departments tab
    if (activeTab === 'departments') {
      baseActions.splice(1, 0, {
        label: 'Permissions',
        icon: Key,
        onClick: () => handlePermissions(item),
      })
    }

    return baseActions
  }

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage categories.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600">Manage categories for assets, documents, and departments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['assets', 'documents', 'departments', 'permissions'] as const).map((tab) => {
            const config = getTabConfig(tab)
            const Icon = config.icon
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setShowAddForm(false)
                  setEditingItem(null)
                }}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-[#187F7E] text-[#187F7E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {config.title}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {(() => {
                    const config = getTabConfig(activeTab)
                    const Icon = config.icon
                    return <Icon className="w-5 h-5 mr-2" />
                  })()}
                  <div>
                    <CardTitle>{getTabConfig(activeTab).title}</CardTitle>
                    <CardDescription>{getTabConfig(activeTab).description}</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#187F7E] hover:bg-[#00AAA8]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : getCurrentCategories().length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No categories found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getCurrentCategories().map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created: {new Date(category.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <ActionsDropdown items={categoryActions(category)} />
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
                  {editingItem ? 'Edit Category' : 'Add New Category'}
                </CardTitle>
                <CardDescription>
                  {editingItem ? 'Update category information' : 'Create a new category'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <Input
                      type="text"
                      value={newCategoryForm.name}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      value={newCategoryForm.description}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
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
                      onClick={cancelForm}
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
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        itemName={deleteModal.item?.name}
        loading={deleteModal.loading}
      />

      {/* Permission Configuration Modal */}
      <PermissionModal
        isOpen={permissionModal.isOpen}
        onClose={() => setPermissionModal({ isOpen: false, department: null, loading: false, permissions: [] })}
        department={permissionModal.department}
        permissions={permissionModal.permissions}
        loading={permissionModal.loading}
        token={token}
        onSave={() => {
          setPermissionModal({ isOpen: false, department: null, loading: false, permissions: [] })
          // Optionally refresh data here
        }}
      />
    </div>
  )
}
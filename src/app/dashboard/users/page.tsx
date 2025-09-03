'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search, Filter, Eye, Edit, Trash2, Shield, User } from 'lucide-react'
import { ActionsDropdown, userActions } from '@/components/ui/actions-dropdown'

interface UserData {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

interface ApiResponse {
  users: UserData[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UsersPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [currentPage, searchTerm, user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: ApiResponse = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
        setTotalUsers(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      USER: 'bg-blue-100 text-blue-800',
      VIEWER: 'bg-gray-100 text-gray-800',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />
      case 'USER':
        return <User className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Tidak Pernah'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleViewUser = (id: string) => {
    router.push(`/dashboard/users/${id}`)
  }

  const handleEditUser = (id: string) => {
    router.push(`/dashboard/users/${id}/edit`)
  }

  const handleToggleUserStatus = async (id: string) => {
    const targetUser = users.find(u => u.id === id)
    if (!targetUser) return

    const action = targetUser.isActive ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`Apakah Anda yakin ingin ${action} pengguna ini?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      })
      
      if (response.ok) {
        // Refresh the users list
        fetchUsers()
        alert(`Pengguna berhasil ${targetUser.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      } else {
        const data = await response.json()
        alert(data.error || `Gagal ${action} pengguna`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert(`Gagal ${action} pengguna`)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        // Refresh the users list
        fetchUsers()
        alert('Pengguna berhasil dihapus')
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal menghapus pengguna')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Gagal menghapus pengguna')
    }
  }

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses manajemen pengguna.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-600">Kelola pengguna sistem dan izin mereka</p>
        </div>
        <Button 
          className="bg-[#187F7E] hover:bg-[#00AAA8]"
          onClick={() => router.push('/dashboard/users/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Peran
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Pengguna ({totalUsers})
          </CardTitle>
          <CardDescription>
            Menampilkan {users.length} dari {totalUsers} pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                <div className="col-span-4">Pengguna</div>
                <div className="col-span-2">Peran</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Login Terakhir</div>
                <div className="col-span-2">Aksi</div>
              </div>

              {/* Table Body */}
              {users.map((userData) => (
                <div key={userData.id} className="grid grid-cols-12 gap-4 px-4 py-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#187F7E] to-[#0EB6B4] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {userData.firstName} {userData.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{userData.email}</p>
                        <p className="text-xs text-gray-400">@{userData.username}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(userData.role)}`}>
                        {getRoleIcon(userData.role)}
                        <span className="ml-1">{userData.role}</span>
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(userData.isActive)}`}>
                      {userData.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{formatDate(userData.lastLogin)}</p>
                    <p className="text-xs text-gray-500">
                      Bergabung {formatDate(userData.createdAt)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <ActionsDropdown 
                      items={userActions(
                        userData,
                        handleViewUser,
                        handleEditUser,
                        handleToggleUserStatus,
                        handleDeleteUser,
                        user?.id
                      )}
                    />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
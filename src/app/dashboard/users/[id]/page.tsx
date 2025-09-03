'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Shield, User, Building, Calendar, Mail, Phone } from 'lucide-react'

interface UserDetail {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
  department?: string
  position?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export default function UserDetailPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'ADMIN' && params.id) {
      fetchUserDetail()
    }
  }, [params.id, user])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUserDetail(data.user)
      } else {
        console.error('Failed to fetch user details')
        router.push('/dashboard/users')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belum pernah'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk melihat detail pengguna.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!userDetail) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Pengguna tidak ditemukan</h3>
        <Button onClick={() => router.push('/dashboard/users')}>
          Kembali ke Daftar Pengguna
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userDetail.firstName} {userDetail.lastName}
            </h1>
            <p className="text-gray-600">Detail Pengguna</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/users/${userDetail.id}/edit`)}
          className="bg-[#187F7E] hover:bg-[#00AAA8]"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Pengguna
        </Button>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                <p className="text-gray-900">{userDetail.firstName} {userDetail.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{userDetail.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-gray-900">@{userDetail.username}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Peran</label>
                <div>
                  <Badge variant={userDetail.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {userDetail.role}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Departemen</label>
                <p className="text-gray-900">{userDetail.department || 'Belum ditentukan'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div>
                  <Badge variant={userDetail.isActive ? 'default' : 'destructive'}>
                    {userDetail.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informasi Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Login Terakhir</label>
              <p className="text-gray-900">{formatDate(userDetail.lastLogin)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tanggal Bergabung</label>
              <p className="text-gray-900">{formatDate(userDetail.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Terakhir Diperbarui</label>
              <p className="text-gray-900">{formatDate(userDetail.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
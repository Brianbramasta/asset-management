'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Users, Activity, TrendingUp, AlertTriangle, Clock, Calendar, BarChart3, PieChart as PieChartIcon, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalAssets: number
  activeAssets: number
  totalDocuments: number
  activeDocuments: number
  totalUsers: number
  activeUsers: number
  recentActivities: number
  assetsByCategory: Array<{ name: string; count: number; color: string }>
  documentsOverTime: Array<{ month: string; count: number }>
  recentAuditActivities: Array<{ date: string; action: string; resource: string; count: number }>
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats(true) // Show refreshing indicator for auto-refresh
    }, 30000)
    
    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [token])

  const fetchDashboardStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Fetch real-time dashboard statistics
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      // Fallback to empty stats
      setStats({
        totalAssets: 0,
        activeAssets: 0,
        totalDocuments: 0,
        activeDocuments: 0,
        totalUsers: 0,
        activeUsers: 0,
        recentActivities: 0,
        assetsByCategory: [],
        documentsOverTime: [],
        recentAuditActivities: [],
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-[#187F7E] to-[#0EB6B4] rounded-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getCurrentGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 17) return 'Selamat Siang'
    if (hour < 21) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return new Date().toLocaleDateString('id-ID', options)
  }

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280']

  const statCards = [
    {
      title: 'Total Aset',
      value: stats?.totalAssets || 0,
      icon: Package,
      color: 'text-[#187F7E]',
      bgColor: 'bg-[#0EB6B4]/10',
    },
    {
      title: 'Dokumen',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'text-[#00AAA8]',
      bgColor: 'bg-[#00AAA8]/10',
    },
    ...(user?.role === 'ADMIN' ? [{
      title: 'Pengguna',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-[#0EB6B4]',
      bgColor: 'bg-[#0EB6B4]/10',
    }] : []),
    ...(user?.role === 'ADMIN' ? [{
      title: 'Aktivitas',
      value: stats?.recentActivities || 0,
      icon: Activity,
      color: 'text-[#D4AF37]',
      bgColor: 'bg-[#D4AF37]/10',
    }] : []),
  ]

  return (
    <div className="space-y-8">
      {/* Beautiful Greeting Header */}
      <div className="bg-gradient-to-r from-[#187F7E] via-[#00AAA8] to-[#0EB6B4] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getCurrentGreeting()}, {user?.firstName} {user?.lastName}! 👋
            </h1>
            <p className="text-[#E8E8E8] flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {getCurrentDate()}
            </p>
            <p className="text-[#E8E8E8] mt-2">
              Selamat datang kembali di sistem manajemen aset perusahaan
            </p>
            {lastUpdated && (
              <p className="text-[#E8E8E8] text-sm mt-2 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
                  <div className="text-sm text-[#E8E8E8]">Total Aset</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                  <div className="text-sm text-[#E8E8E8]">Dokumen</div>
                </div>
                <div className="ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchDashboardStats(true)}
                    disabled={refreshing}
                    className="text-white hover:bg-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assets by Category Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-[#187F7E]" />
                  Aset Berdasarkan Kategori
                </CardTitle>
                <CardDescription>Distribusi aset berdasarkan jenis kategori</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.assetsByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.assetsByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Documents Over Time Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-[#00AAA8]" />
                  Dokumen Bulanan
                </CardTitle>
                <CardDescription>Jumlah dokumen yang diunggah per bulan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.documentsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#187F7E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      {user?.role === 'ADMIN' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#D4AF37]" />
              Aktivitas Terkini
            </CardTitle>
            <CardDescription>Log aktivitas sistem dalam 24 jam terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.recentAuditActivities || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 mr-2 text-[#187F7E]" />
              <h3 className="text-lg font-semibold text-gray-900">Manajemen Aset</h3>
            </div>
            <p className="text-sm text-gray-600">
              Kelola aset fisik perusahaan Anda
            </p>
          </div>
          <div className="space-y-2">
            <a
              href="/dashboard/assets"
              className="block px-3 py-2 text-sm text-[#187F7E] hover:bg-[#0EB6B4]/10 rounded transition-colors"
            >
              Lihat Semua Aset
            </a>
            <a
              href="/dashboard/assets/new"
              className="block px-3 py-2 text-sm text-[#187F7E] hover:bg-[#0EB6B4]/10 rounded transition-colors"
            >
              Tambah Aset Baru
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 mr-2 text-[#00AAA8]" />
              <h3 className="text-lg font-semibold text-gray-900">Arsip Dokumen</h3>
            </div>
            <p className="text-sm text-gray-600">
              Manajemen dokumen standar ISO
            </p>
          </div>
          <div className="space-y-2">
            <a
              href="/dashboard/documents"
              className="block px-3 py-2 text-sm text-[#00AAA8] hover:bg-[#00AAA8]/10 rounded transition-colors"
            >
              Lihat Dokumen
            </a>
            <a
              href="/dashboard/documents/upload"
              className="block px-3 py-2 text-sm text-[#00AAA8] hover:bg-[#00AAA8]/10 rounded transition-colors"
            >
              Unggah Dokumen
            </a>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-[#0EB6B4]" />
                <h3 className="text-lg font-semibold text-gray-900">Manajemen Pengguna</h3>
              </div>
              <p className="text-sm text-gray-600">
                Kelola pengguna sistem dan izin
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="/dashboard/users"
                className="block px-3 py-2 text-sm text-[#0EB6B4] hover:bg-[#0EB6B4]/10 rounded transition-colors"
              >
                Lihat Pengguna
              </a>
              <a
                href="/dashboard/users/new"
                className="block px-3 py-2 text-sm text-[#0EB6B4] hover:bg-[#0EB6B4]/10 rounded transition-colors"
              >
                Tambah Pengguna Baru
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 mr-2 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terkini</h3>
            </div>
            <p className="text-sm text-gray-600">
              Aktivitas sistem terbaru dan log audit
            </p>
          </div>
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              <a href="/dashboard/audit" className="text-[#D4AF37] hover:underline">
                Lihat log audit
              </a>
              {' '}untuk melihat riwayat aktivitas detail
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
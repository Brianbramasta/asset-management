'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Search, Filter, Eye, User, Package, FileText, Shield, Copy, Download, Calendar } from 'lucide-react'
import { ActionsDropdown } from '@/components/ui/actions-dropdown'

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

interface ApiResponse {
  auditLogs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AuditPage() {
  const { token, user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    resource: 'all',
    action: 'all',
    startDate: '',
    endDate: '',
    userId: ''
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAuditLogs()
    }
  }, [currentPage, searchTerm, filters, user])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.resource && filters.resource !== 'all' && { resource: filters.resource }),
        ...(filters.action && filters.action !== 'all' && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.userId && { userId: filters.userId }),
      })

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: ApiResponse = await response.json()
        setAuditLogs(data.auditLogs)
        setTotalPages(data.pagination.pages)
        setTotalLogs(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-cyan-100 text-cyan-800',
      DUPLICATE: 'bg-orange-100 text-orange-800',
      LOGIN: 'bg-[#187F7E]/10 text-[#187F7E]',
      LOGOUT: 'bg-gray-100 text-gray-800',
    }
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'User':
        return <User className="w-4 h-4" />
      case 'Asset':
        return <Package className="w-4 h-4" />
      case 'Document':
        return <FileText className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Tidak Dikenal'
    
    // Extract browser info
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    
    return 'Lainnya'
  }

  const getChangesPreview = (oldValues?: string, newValues?: string) => {
    if (!oldValues && !newValues) return null

    try {
      const oldData = oldValues ? JSON.parse(oldValues) : {}
      const newData = newValues ? JSON.parse(newValues) : {}
      
      const changedKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
      const changes = Array.from(changedKeys).slice(0, 3) // Show only first 3 changes
      
      return changes.map(key => (
        <div key={key} className="text-xs text-gray-600">
          <span className="font-medium">{key}:</span>
          {oldData[key] && <span className="text-red-600 line-through ml-1">{String(oldData[key]).slice(0, 20)}</span>}
          {newData[key] && <span className="text-green-600 ml-1">{String(newData[key]).slice(0, 20)}</span>}
        </div>
      ))
    } catch {
      return <span className="text-xs text-gray-500">Perubahan tersedia</span>
    }
  }

  const handleViewAuditDetails = (log: AuditLog) => {
    // Create a detailed view of the audit log
    const details = {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      timestamp: log.timestamp,
      user: `${log.user.firstName} ${log.user.lastName} (${log.user.email})`,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      oldValues: log.oldValues,
      newValues: log.newValues,
    }
    
    alert(`Detail Log Audit:\n\n${Object.entries(details)
      .filter(([key, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}`)
  }

  const handleCopyLogId = (logId: string) => {
    navigator.clipboard.writeText(logId)
    alert('ID log berhasil disalin!')
  }

  const handleExportLog = (log: AuditLog) => {
    const logData = {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      timestamp: log.timestamp,
      user: {
        name: `${log.user.firstName} ${log.user.lastName}`,
        email: log.user.email,
      },
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      changes: {
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
      },
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${log.id}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchAuditLogs()
  }

  const resetFilters = () => {
    setFilters({
      resource: 'all',
      action: 'all',
      startDate: '',
      endDate: '',
      userId: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const auditActions = (log: AuditLog) => [
    {
      label: 'Lihat Detail',
      icon: Eye,
      onClick: () => handleViewAuditDetails(log),
    },
    {
      label: 'Salin ID',
      icon: Copy,
      onClick: () => handleCopyLogId(log.id),
    },
    {
      label: 'Ekspor Data',
      icon: Download,
      onClick: () => handleExportLog(log),
    },
  ]

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses log audit.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log Audit</h1>
          <p className="text-gray-600">Pantau semua aktivitas sistem dan tindakan pengguna</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan aksi atau pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {showFilters && (
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sumber Daya
                </label>
                <Select 
                  value={filters.resource} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sumber Daya</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Asset">Asset</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="DigitalAsset">Digital Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aksi
                </label>
                <Select 
                  value={filters.action} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aksi</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="VIEW">View</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="DUPLICATE">Duplicate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Akhir
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              <div className="flex flex-col justify-end space-y-2">
                <Button type="submit" className="bg-[#187F7E] hover:bg-[#00AAA8]">
                  Terapkan Filter
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Log Aktivitas ({totalLogs})
          </CardTitle>
          <CardDescription>
            Menampilkan {auditLogs.length} dari {totalLogs} aktivitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada log audit ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    {/* Timeline line */}
                    {index !== auditLogs.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                        {getResourceIcon(log.resource)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                                {log.action}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{log.resource}</span>
                              {log.resourceId && (
                                <span className="text-xs text-gray-500">#{log.resourceId.slice(-8)}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{log.user.firstName} {log.user.lastName}</span>
                              </span>
                              <span>{formatDate(log.timestamp)}</span>
                              {log.ipAddress && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {log.ipAddress}
                                </span>
                              )}
                              {log.userAgent && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {formatUserAgent(log.userAgent)}
                                </span>
                              )}
                            </div>
                            
                            {/* Changes preview */}
                            {(log.oldValues || log.newValues) && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <span className="font-medium text-gray-700 block mb-1">Perubahan:</span>
                                {getChangesPreview(log.oldValues, log.newValues)}
                              </div>
                            )}
                          </div>
                          
                          <ActionsDropdown items={auditActions(log)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
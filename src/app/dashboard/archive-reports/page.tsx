'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart, Calendar, Download, Filter, FileText, ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash2 } from 'lucide-react'

interface ArchiveReport {
  id: string
  documentId: string
  department: string
  action: 'IN' | 'OUT' | 'UPDATED' | 'DELETED' | 'VIEWED' | 'SHARED'
  performedBy: string
  reason?: string
  notes?: string
  timestamp: string
}

interface ReportFilters {
  department: string
  action: string
  startDate: string
  endDate: string
  page: number
  limit: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ArchiveReportsPage() {
  const { token, user } = useAuth()
  const [reports, setReports] = useState<ArchiveReport[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [filters, setFilters] = useState<ReportFilters>({
    department: '',
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [user, filters.page])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      })
      
      if (filters.department) params.append('department', filters.department)
      if (filters.action) params.append('action', filters.action)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/archive-reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        setPagination(data.pagination || {})
      }
    } catch (error) {
      console.error('Failed to fetch archive reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, page: 1 }))
    fetchReports()
  }

  const resetFilters = () => {
    setFilters({
      department: '',
      action: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    })
    setTimeout(fetchReports, 100)
  }

  const exportReports = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.department) params.append('department', filters.department)
      if (filters.action) params.append('action', filters.action)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('export', 'true')

      const response = await fetch(`/api/archive-reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `archive-reports-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export reports:', error)
      alert('Failed to export reports')
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'IN':
        return <ArrowUpCircle className="w-4 h-4 text-[#187F7E]" />
      case 'OUT':
        return <ArrowDownCircle className="w-4 h-4 text-red-600" />
      case 'UPDATED':
        return <RefreshCw className="w-4 h-4 text-[#00AAA8]" />
      case 'DELETED':
        return <Trash2 className="w-4 h-4 text-gray-600" />
      case 'VIEWED':
        return <FileText className="w-4 h-4 text-[#0EB6B4]" />
      case 'SHARED':
        return <FileText className="w-4 h-4 text-[#D4AF37]" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionBadge = (action: string) => {
    const badges = {
      IN: 'bg-[#187F7E]/10 text-[#187F7E]',
      OUT: 'bg-red-100 text-red-800',
      UPDATED: 'bg-[#00AAA8]/10 text-[#00AAA8]',
      DELETED: 'bg-gray-100 text-gray-800',
      VIEWED: 'bg-[#0EB6B4]/10 text-[#0EB6B4]',
      SHARED: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    }
    return badges[action as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archive Reports</h1>
          <p className="text-gray-600">Track document flow and archive activities</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={exportReports}
            className="bg-[#187F7E] hover:bg-[#00AAA8]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>Filter archive reports by department, action, and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Input
                  type="text"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="All departments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#187F7E]"
                >
                  <option value="">All actions</option>
                  <option value="IN">Document In</option>
                  <option value="OUT">Document Out</option>
                  <option value="UPDATED">Updated</option>
                  <option value="DELETED">Deleted</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="SHARED">Shared</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2 md:col-span-4">
                <Button type="submit" className="bg-[#187F7E] hover:bg-[#00AAA8]">
                  Apply Filters
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              <div>
                <CardTitle>Archive Activity Reports</CardTitle>
                <CardDescription>
                  {pagination.total > 0 
                    ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} reports`
                    : 'No reports found'
                  }
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={fetchReports}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No archive reports found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Document ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Performed By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getActionIcon(report.action)}
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(report.action)}`}>
                              {report.action}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{report.department}</td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600">{report.documentId.slice(0, 8)}...</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{report.performedBy}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(report.timestamp)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div>
                            {report.reason && <div className="font-medium">{report.reason}</div>}
                            {report.notes && <div className="text-xs text-gray-500 mt-1">{report.notes}</div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i
                      if (pageNum <= pagination.pages) {
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                          >
                            {pageNum}
                          </Button>
                        )
                      }
                      return null
                    })}
                  </div>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
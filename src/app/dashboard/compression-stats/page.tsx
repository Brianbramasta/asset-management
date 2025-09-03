'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardDrive, Zap, FileText, TrendingDown, Info, BarChart, RefreshCw } from 'lucide-react'

export default function CompressionStatsPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
    averageCompressionRate: 0,
    compressionByType: {},
  })

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCompressionStats()
    }
  }, [user])

  const fetchCompressionStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/compression-stats', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch compression stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const compressionFeatures = [
    {
      title: 'Modern Office Files',
      description: 'DOCX, XLSX, PPTX files (already compressed)',
      expectedSavings: '5-15%',
      icon: '📄',
      color: 'text-[#00AAA8]'
    },
    {
      title: 'Legacy Office Files', 
      description: 'DOC, XLS, PPT, RTF files',
      expectedSavings: '20-40%',
      icon: '📋',
      color: 'text-green-600'
    },
    {
      title: 'Text Files',
      description: 'TXT, CSV, XML, JSON files',
      expectedSavings: '30-70%',
      icon: '📝',
      color: 'text-[#187F7E]'
    },
    {
      title: 'PDF Files',
      description: 'PDF optimization and compression',
      expectedSavings: '10-25%',
      icon: '📕',
      color: 'text-red-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Compression System</h1>
          <p className="text-gray-600">Intelligent file compression to optimize storage and reduce server load</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button
            onClick={fetchCompressionStats}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        )}
      </div>

      {/* Overview Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#187F7E] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading compression statistics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-[#00AAA8]" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.totalFiles.toLocaleString()}</p>
                <p className="text-gray-600">Total Files Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{formatFileSize(stats.totalSavings)}</p>
                <p className="text-gray-600">Storage Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-[#187F7E]" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.averageCompressionRate}%</p>
                <p className="text-gray-600">Avg Compression</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{Math.round((stats.totalSavings / stats.totalOriginalSize) * 100)}%</p>
                <p className="text-gray-600">Total Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Compression by File Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Compression by File Type
          </CardTitle>
          <CardDescription>Breakdown of compression effectiveness by file type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.compressionByType).map(([type, data]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-900">{type}</h3>
                    <span className="text-sm text-gray-500">({data.count} files)</span>
                  </div>
                  <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                    <span>Original: {formatFileSize(data.originalSize)}</span>
                    <span>Compressed: {formatFileSize(data.compressedSize)}</span>
                    <span className="font-medium text-green-600">Saved: {data.savings}%</span>
                  </div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(data.savings, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compression Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Smart Compression Features
          </CardTitle>
          <CardDescription>How our intelligent compression system works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {compressionFeatures.map((feature, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    <div className="mt-2">
                      <span className={`text-sm font-medium ${feature.color}`}>
                        Expected Savings: {feature.expectedSavings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[#0EB6B4]/10 border border-[#0EB6B4]/30 rounded-lg">
            <div className="flex">
              <Info className="h-5 w-5 text-[#00AAA8] mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">How Smart Compression Works</h4>
                <p className="text-sm text-[#187F7E] mt-1">
                  Our system automatically analyzes each uploaded file and applies the most appropriate compression strategy. 
                  Modern office formats that are already compressed receive minimal processing, while legacy formats and text files 
                  can achieve significant size reductions. This reduces server storage costs and improves download speeds.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
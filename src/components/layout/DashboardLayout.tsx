'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building2, 
  Users, 
  Package, 
  FileText, 
  Activity, 
  Settings,
  LogOut,
  Menu,
  X,
  FileImage,
  BarChart,
  HardDrive,
  ChevronDown,
  Palette
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  group?: string
  adminOnly?: boolean
  module?: string
}

const navigation: NavigationItem[] = [
  // Main Operations
  { name: 'Dasbor', href: '/dashboard', icon: Activity, group: 'main' },
  { name: 'Aset', href: '/dashboard/assets', icon: Package, group: 'main', module: 'ASSETS' },
  { name: 'Dokumen', href: '/dashboard/documents', icon: FileText, group: 'main', module: 'DOCUMENTS' },
  { name: 'Aset Digital', href: '/dashboard/digital-assets', icon: Palette, group: 'main', module: 'DIGITAL_ASSETS' },
  
  // Reports & Analytics
  { name: 'Laporan Arsip', href: '/dashboard/archive-reports', icon: BarChart, group: 'reports', module: 'REPORTS' },
  
  // Settings & Administration
  { name: 'Pengguna', href: '/dashboard/users', icon: Users, adminOnly: true, group: 'settings', module: 'USERS' },
  { name: 'Kategori', href: '/dashboard/categories', icon: Settings, adminOnly: true, group: 'settings', module: 'SETTINGS' },
  { name: 'Watermark', href: '/dashboard/watermarks', icon: FileImage, adminOnly: true, group: 'settings', module: 'SETTINGS' },
  { name: 'Kompresi', href: '/dashboard/compression-stats', icon: HardDrive, adminOnly: true, group: 'settings', module: 'SETTINGS' },
  { name: 'Log Audit', href: '/dashboard/audit', icon: Activity, adminOnly: true, group: 'settings', module: 'AUDIT_LOGS' },
]

const navigationGroups = {
  main: { label: 'Operasi Utama', showLabel: false },
  reports: { label: 'Laporan', showLabel: true },
  settings: { label: 'Pengaturan', showLabel: true },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, loading, token } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<{ [key: string]: { canRead: boolean, canWrite: boolean, canDelete: boolean } }>({})
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch user permissions
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && token && user.department) {
      fetchUserPermissions()
    } else if (user) {
      setPermissionsLoaded(true)
    }
  }, [user, token])

  const fetchUserPermissions = async () => {
    if (!user?.department) {
      setPermissionsLoaded(true)
      return
    }
    
    try {
      const response = await fetch(`/api/permissions?department=${encodeURIComponent(user.department)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        const permissionMap: { [key: string]: { canRead: boolean, canWrite: boolean, canDelete: boolean } } = {}
        
        data.permissions.forEach((perm: any) => {
          permissionMap[perm.module] = {
            canRead: perm.canRead,
            canWrite: perm.canWrite,
            canDelete: perm.canDelete
          }
        })
        
        setUserPermissions(permissionMap)
      } else {
        console.error('Failed to fetch permissions, status:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error)
    } finally {
      setPermissionsLoaded(true)
    }
  }

  const hasModuleAccess = (module?: string) => {
    // Dashboard is always accessible
    if (!module) return true
    
    // Admin has access to everything
    if (user?.role === 'ADMIN') return true
    
    // Check user permissions for the module
    if (module && userPermissions[module]) {
      return userPermissions[module].canRead
    }
    
    // Default to no access if permissions not found for non-admin users
    return false
  }

  if (loading || !permissionsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredNavigation = navigation.filter(item => {
    // Check admin-only access
    if (item.adminOnly && user.role !== 'ADMIN') {
      return false
    }
    
    // Check module-based permissions
    return hasModuleAccess(item.module)
  })

  // Group navigation items
  const groupedNavigation = filteredNavigation.reduce((groups: any, item) => {
    const group = item.group || 'main'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {})

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const renderNavigation = () => (
    <>
      {Object.entries(groupedNavigation).map(([groupKey, items]: [string, any], groupIndex) => (
        <div key={groupKey}>
          {navigationGroups[groupKey as keyof typeof navigationGroups]?.showLabel && (
            <div className="px-3 py-2 mt-4 first:mt-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {navigationGroups[groupKey as keyof typeof navigationGroups]?.label}
              </h3>
            </div>
          )}
          {items.map((item: any) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-[#0EB6B4] text-white border-r-2 border-[#187F7E]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            )
          })}
          {groupIndex < Object.keys(groupedNavigation).length - 1 && (
            <div className="my-4 border-t border-gray-200"></div>
          )}
        </div>
      ))}
    </>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-lg">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-[#187F7E] to-[#00AAA8] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Orderkuota</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {renderNavigation()}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-100 shadow-sm">
          <div className="flex items-center h-16 px-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-r from-[#187F7E] to-[#00AAA8] rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Orderkuota</span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {renderNavigation()}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between bg-white px-4 shadow-sm border-b border-gray-100 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {/* Spacer for centering when needed */}
          <div className="flex-1"></div>
          
          {/* Profile Menu - Top Right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#187F7E] to-[#0EB6B4] flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
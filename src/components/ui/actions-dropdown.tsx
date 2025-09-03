'use client'

import { MoreVertical, Eye, Edit, Trash2, Download, Copy, Share2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActionMenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive' | 'warning'
  disabled?: boolean
}

interface ActionsDropdownProps {
  items: ActionMenuItem[]
  triggerClassName?: string
}

export function ActionsDropdown({ items, triggerClassName }: ActionsDropdownProps) {
  const getItemClassName = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return 'text-red-600 focus:text-red-600 focus:bg-red-50'
      case 'warning':
        return 'text-orange-600 focus:text-orange-600 focus:bg-orange-50'
      default:
        return 'text-gray-700 focus:text-gray-900'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 w-8 p-0 hover:bg-gray-100 ${triggerClassName}`}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Buka menu aksi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item, index) => {
          const Icon = item.icon
          const isLastGroup = index === items.length - 1
          const showSeparator = index > 0 && (
            item.variant === 'destructive' || 
            items[index - 1].variant !== item.variant
          )
          
          return (
            <div key={index}>
              {showSeparator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={item.onClick}
                disabled={item.disabled}
                className={getItemClassName(item.variant)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Predefined action sets for different entities
export const assetActions = (
  asset: any, 
  onView: (id: string) => void, 
  onEdit: (id: string) => void, 
  onDuplicate: (id: string) => void, 
  onDelete: (id: string) => void
) => [
  {
    label: 'Lihat Detail',
    icon: Eye,
    onClick: () => onView(asset.id),
  },
  {
    label: 'Edit Aset',
    icon: Edit,
    onClick: () => onEdit(asset.id),
  },
  {
    label: 'Duplikasi',
    icon: Copy,
    onClick: () => onDuplicate(asset.id),
  },
  {
    label: 'Hapus',
    icon: Trash2,
    onClick: () => onDelete(asset.id),
    variant: 'destructive' as const,
  },
]

export const documentActions = (
  document: any, 
  onView: (id: string) => void, 
  onEdit: (id: string) => void, 
  onDownload: (id: string, fileName: string) => void,
  onShare: (id: string, fileName: string) => void,
  onArchive: (id: string) => void,
  onDelete: (document: any) => void
) => [
  {
    label: 'Lihat Detail',
    icon: Eye,
    onClick: () => onView(document.id),
  },
  {
    label: 'Unduh',
    icon: Download,
    onClick: () => onDownload(document.id, document.fileName),
  },
  {
    label: 'Edit Dokumen',
    icon: Edit,
    onClick: () => onEdit(document.id),
  },
  {
    label: 'Bagikan',
    icon: Share2,
    onClick: () => onShare(document.id, document.fileName),
  },
  {
    label: 'Arsipkan',
    icon: Archive,
    onClick: () => onArchive(document.id),
    variant: 'warning' as const,
  },
  {
    label: 'Hapus',
    icon: Trash2,
    onClick: () => onDelete(document),
    variant: 'destructive' as const,
  },
]

export const userActions = (
  userData: any, 
  onView: (id: string) => void, 
  onEdit: (id: string) => void, 
  onToggleStatus: (id: string) => void, 
  onDelete: (id: string) => void,
  currentUserId?: string
) => [
  {
    label: 'Lihat Profil',
    icon: Eye,
    onClick: () => onView(userData.id),
  },
  {
    label: 'Edit Pengguna',
    icon: Edit,
    onClick: () => onEdit(userData.id),
  },
  {
    label: userData.isActive ? 'Nonaktifkan' : 'Aktifkan',
    icon: Archive,
    onClick: () => onToggleStatus(userData.id),
    variant: 'warning' as const,
  },
  {
    label: 'Hapus',
    icon: Trash2,
    onClick: () => onDelete(userData.id),
    variant: 'destructive' as const,
    disabled: userData.id === currentUserId,
  },
]
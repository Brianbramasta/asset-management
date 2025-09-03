import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PermissionCheck {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
}

/**
 * Check if a user has specific permissions for a module
 * @param userDepartment - User's department
 * @param userRole - User's role (ADMIN, USER, VIEWER)
 * @param module - System module to check (ASSETS, DOCUMENTS, DIGITAL_ASSETS, etc.)
 * @returns Permission object with read, write, delete flags
 */
export async function checkUserPermissions(
  userDepartment: string | null,
  userRole: string,
  module: string
): Promise<PermissionCheck> {
  try {
    // Admin users have full access to everything
    if (userRole === 'ADMIN') {
      return {
        canRead: true,
        canWrite: true,
        canDelete: true
      }
    }

    // If user has no department, default to read-only
    if (!userDepartment) {
      return {
        canRead: true,
        canWrite: false,
        canDelete: false
      }
    }

    // Get department permissions
    const permission = await prisma.departmentPermission.findUnique({
      where: {
        department_module: {
          department: userDepartment,
          module: module
        },
        isActive: true
      }
    })

    if (!permission) {
      // Default permissions if no specific permission is set
      return {
        canRead: true, // Default read access
        canWrite: false,
        canDelete: false
      }
    }

    return {
      canRead: permission.canRead,
      canWrite: permission.canWrite,
      canDelete: permission.canDelete
    }
  } catch (error) {
    console.error('Error checking user permissions:', error)
    // Default to safe permissions on error
    return {
      canRead: true,
      canWrite: false,
      canDelete: false
    }
  }
}

/**
 * Check if user can read a specific module
 */
export async function canUserRead(userDepartment: string | null, userRole: string, module: string): Promise<boolean> {
  const permissions = await checkUserPermissions(userDepartment, userRole, module)
  return permissions.canRead
}

/**
 * Check if user can write/edit in a specific module
 */
export async function canUserWrite(userDepartment: string | null, userRole: string, module: string): Promise<boolean> {
  const permissions = await checkUserPermissions(userDepartment, userRole, module)
  return permissions.canWrite
}

/**
 * Check if user can delete in a specific module
 */
export async function canUserDelete(userDepartment: string | null, userRole: string, module: string): Promise<boolean> {
  const permissions = await checkUserPermissions(userDepartment, userRole, module)
  return permissions.canDelete
}

/**
 * Get all permissions for a department
 */
export async function getDepartmentPermissions(department: string) {
  try {
    const permissions = await prisma.departmentPermission.findMany({
      where: {
        department,
        isActive: true
      },
      orderBy: {
        module: 'asc'
      }
    })

    // Convert to a map for easy lookup
    const permissionMap: { [key: string]: PermissionCheck } = {}
    permissions.forEach(perm => {
      permissionMap[perm.module] = {
        canRead: perm.canRead,
        canWrite: perm.canWrite,
        canDelete: perm.canDelete
      }
    })

    return permissionMap
  } catch (error) {
    console.error('Error getting department permissions:', error)
    return {}
  }
}

/**
 * Create middleware function for API route protection
 */
export function withPermissionCheck(requiredModule: string, requiredAction: 'read' | 'write' | 'delete') {
  return function (handler: Function) {
    return async function (request: any, context?: any) {
      try {
        // Extract user from request (assuming JWT verification is done)
        const user = (request as any).user
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Check permissions
        const permissions = await checkUserPermissions(user.department, user.role, requiredModule)
        
        let hasPermission = false
        switch (requiredAction) {
          case 'read':
            hasPermission = permissions.canRead
            break
          case 'write':
            hasPermission = permissions.canWrite
            break
          case 'delete':
            hasPermission = permissions.canDelete
            break
        }

        if (!hasPermission) {
          return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Call the original handler
        return await handler(request, context)
      } catch (error) {
        console.error('Permission check error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }
}

/**
 * System modules constants
 */
export const SYSTEM_MODULES = {
  ASSETS: 'ASSETS',
  DOCUMENTS: 'DOCUMENTS',
  DIGITAL_ASSETS: 'DIGITAL_ASSETS',
  USERS: 'USERS',
  AUDIT_LOGS: 'AUDIT_LOGS',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS'
} as const
import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

// Asset validation schemas
export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  currentValue: z.string().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'DISPOSED']).optional(),
  location: z.string().min(1, 'Location is required'),
  department: z.string().optional(),
  assignedTo: z.string().optional(),
  warrantyUntil: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  barcode: z.string().optional(),
})

export const updateAssetSchema = createAssetSchema.extend({
  isActive: z.boolean().optional(),
})

// Document validation schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  description: z.string().optional(),
  category: z.enum(['POLICY', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'RECORD', 'MANUAL', 'CERTIFICATE', 'CONTRACT', 'CORRESPONDENCE', 'OTHER']),
  subcategory: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().optional(),
})

export const updateDocumentSchema = createDocumentSchema.extend({
  isActive: z.boolean().optional(),
})

// File validation
export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.toLowerCase().split('.').pop()
  return allowedTypes.includes(`.${extension}`)
}

export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize
}

// Security utilities
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"']/g, '')
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
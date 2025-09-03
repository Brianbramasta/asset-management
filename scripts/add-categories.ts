import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSampleCategories() {
  try {
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (!admin) {
      console.log('Admin user not found')
      return
    }

    // Sample categories
    const categories = [
      // Asset categories
      { name: 'Computer & IT Equipment', type: 'ASSET', description: 'Computers, laptops, servers, networking equipment' },
      { name: 'Furniture & Fixtures', type: 'ASSET', description: 'Desks, chairs, cabinets, office furniture' },
      { name: 'Vehicles', type: 'ASSET', description: 'Company cars, motorcycles, trucks' },
      { name: 'Equipment & Machinery', type: 'ASSET', description: 'Tools, machinery, specialized equipment' },
      
      // Document categories (mapped to DocumentCategory enum)
      { name: 'Policy Documents', type: 'DOCUMENT', description: 'Company policies and guidelines' },
      { name: 'Procedure Documents', type: 'DOCUMENT', description: 'Standard operating procedures' },
      { name: 'Work Instructions', type: 'DOCUMENT', description: 'Detailed work instructions' },
      { name: 'Forms', type: 'DOCUMENT', description: 'Standard forms and templates' },
      { name: 'Records', type: 'DOCUMENT', description: 'Record keeping documents' },
      { name: 'Manual Documents', type: 'DOCUMENT', description: 'User manuals and guides' },
      { name: 'Certificates', type: 'DOCUMENT', description: 'Certificates and qualifications' },
      { name: 'Contracts', type: 'DOCUMENT', description: 'Legal contracts and agreements' },
      { name: 'Correspondence', type: 'DOCUMENT', description: 'Business correspondence' },
      { name: 'Other Documents', type: 'DOCUMENT', description: 'Other miscellaneous documents' },
      
      // Department categories
      { name: 'IT Department', type: 'DEPARTMENT', description: 'Information Technology Department' },
      { name: 'HR Department', type: 'DEPARTMENT', description: 'Human Resources Department' },
      { name: 'Finance Department', type: 'DEPARTMENT', description: 'Finance and Accounting Department' },
      { name: 'Operations Department', type: 'DEPARTMENT', description: 'Operations Department' },
      { name: 'Marketing Department', type: 'DEPARTMENT', description: 'Marketing and Sales Department' },
      { name: 'Administration', type: 'DEPARTMENT', description: 'Administration Department' },
    ]

    for (const categoryData of categories) {
      // Check if category already exists
      const existing = await prisma.category.findFirst({
        where: { 
          name: categoryData.name,
          type: categoryData.type as any
        },
      })

      if (!existing) {
        await prisma.category.create({
          data: {
            ...categoryData,
            type: categoryData.type as any,
            createdById: admin.id,
          },
        })
        console.log(`✅ Created category: ${categoryData.name} (${categoryData.type})`)
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name}`)
      }
    }

    // Create sample watermark configuration
    const existingWatermark = await prisma.watermarkConfig.findUnique({
      where: { department: 'IT Department' },
    })

    if (!existingWatermark) {
      await prisma.watermarkConfig.create({
        data: {
          department: 'IT Department',
          text: 'CONFIDENTIAL - IT DEPARTMENT',
          opacity: 0.3,
          position: 'center',
          fontSize: 12,
          color: '#888888',
          isActive: true,
          createdById: admin.id,
        },
      })
      console.log('✅ Created sample watermark configuration')
    }

    console.log('\n🎉 Sample categories and configurations added successfully!')

  } catch (error) {
    console.error('Error adding sample categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleCategories()
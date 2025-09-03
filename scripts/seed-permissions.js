const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedPermissions() {
  try {
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      throw new Error('Admin user not found')
    }

    // Define default permissions for different departments
    const permissionsData = [
      // Digital Department - Full access to digital assets, read access to others
      { department: 'Digital Department', module: 'DIGITAL_ASSETS', canRead: true, canWrite: true, canDelete: true },
      { department: 'Digital Department', module: 'ASSETS', canRead: true, canWrite: false, canDelete: false },
      { department: 'Digital Department', module: 'DOCUMENTS', canRead: true, canWrite: false, canDelete: false },
      
      // IT Department - Full access to assets and documents, read-only for digital assets
      { department: 'IT Department', module: 'ASSETS', canRead: true, canWrite: true, canDelete: true },
      { department: 'IT Department', module: 'DOCUMENTS', canRead: true, canWrite: true, canDelete: true },
      { department: 'IT Department', module: 'DIGITAL_ASSETS', canRead: true, canWrite: false, canDelete: false },
      
      // HR Department - Full access to documents, read-only for others
      { department: 'HR Department', module: 'DOCUMENTS', canRead: true, canWrite: true, canDelete: true },
      { department: 'HR Department', module: 'ASSETS', canRead: true, canWrite: false, canDelete: false },
      { department: 'HR Department', module: 'DIGITAL_ASSETS', canRead: true, canWrite: false, canDelete: false },
    ]

    // Create permissions
    for (const permData of permissionsData) {
      await prisma.departmentPermission.create({
        data: {
          ...permData,
          createdById: admin.id
        }
      })
      console.log(`Permission created: ${permData.department} - ${permData.module}`)
    }

    console.log('✅ Default permissions seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding permissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedPermissions()
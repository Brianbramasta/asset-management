const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        department: 'Administration',
        position: 'MANAGER',
        isActive: true,
      },
    })

    console.log('Admin user created:', admin.email)

    // Create sample regular user
    const userPassword = await bcrypt.hash('user123', 12)
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: userPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        department: 'IT Department',
        position: 'STAFF',
        isActive: true,
      },
    })

    console.log('Sample user created:', user.email)

    // Create some sample data
    const asset = await prisma.asset.create({
      data: {
        name: 'Laptop Dell Latitude 7420',
        description: 'Business laptop for office work',
        category: 'IT Equipment',
        subcategory: 'Laptops',
        brand: 'Dell',
        model: 'Latitude 7420',
        serialNumber: 'DL7420001',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 1200.00,
        currentValue: 800.00,
        condition: 'GOOD',
        location: 'Office Floor 1',
        department: 'IT Department',
        assignedTo: 'John Doe',
        warrantyUntil: new Date('2026-01-15'),
        notes: 'Assigned to new employee',
        barcode: 'BC001',
        createdById: admin.id,
        updatedById: admin.id,
      },
    })

    console.log('Sample asset created:', asset.name)

    // Create sample categories
    const categories = [
      { name: 'Computer & IT Equipment', type: 'ASSET', description: 'Computers, laptops, servers' },
      { name: 'Furniture & Fixtures', type: 'ASSET', description: 'Desks, chairs, cabinets' },
      { name: 'Policy Documents', type: 'DOCUMENT', description: 'Company policies and guidelines' },
      { name: 'IT Department', type: 'DEPARTMENT', description: 'Information Technology Department' },
      { name: 'HR Department', type: 'DEPARTMENT', description: 'Human Resources Department' },
      { name: 'Digital Department', type: 'DEPARTMENT', description: 'Digital Content Creation Department' },
    ]

    for (const categoryData of categories) {
      await prisma.category.create({
        data: {
          ...categoryData,
          createdById: admin.id,
        },
      })
      console.log(`Sample category created: ${categoryData.name}`)
    }

    // Create sample watermark configuration
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

    console.log('Sample watermark configuration created')

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
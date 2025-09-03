const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugDigitalAssets() {
  try {
    console.log('🔍 Debugging Digital Assets...\n')
    
    // Check all digital assets in database
    const allDigitalAssets = await prisma.digitalAsset.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            role: true,
          },
        },
      },
    })

    console.log(`📊 Total digital assets in database: ${allDigitalAssets.length}`)
    
    if (allDigitalAssets.length > 0) {
      console.log('\n📋 Digital Assets Details:')
      allDigitalAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. ${asset.contentName}`)
        console.log(`   - ID: ${asset.id}`)
        console.log(`   - Department: ${asset.department || 'NULL'}`)
        console.log(`   - isActive: ${asset.isActive}`)
        console.log(`   - Created by: ${asset.createdBy.firstName} ${asset.createdBy.lastName} (${asset.createdBy.email})`)
        console.log(`   - Creator Department: ${asset.createdBy.department || 'NULL'}`)
        console.log(`   - Creator Role: ${asset.createdBy.role}`)
        console.log(`   - Created at: ${asset.createdAt}`)
      })
    }

    // Check active digital assets only
    const activeAssets = await prisma.digitalAsset.findMany({
      where: { isActive: true },
    })
    console.log(`\n✅ Active digital assets: ${activeAssets.length}`)

    // Check all users and their departments
    console.log('\n👥 All users and their departments:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        role: true,
        isActive: true,
      },
    })

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`)
      console.log(`   - Department: ${user.department || 'NULL'}`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Active: ${user.isActive}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDigitalAssets()
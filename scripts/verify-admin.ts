import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function verifyCredentials() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (!user) {
      console.log('❌ Admin user not found')
      return
    }

    console.log('✅ Admin user found:')
    console.log('  - Email:', user.email)
    console.log('  - Username:', user.username)
    console.log('  - Name:', `${user.firstName} ${user.lastName}`)
    console.log('  - Role:', user.role)
    console.log('  - Department:', user.department)
    console.log('  - Position:', user.position)
    console.log('  - Active:', user.isActive)

    // Verify password
    const isValidPassword = await bcrypt.compare('admin123', user.password)
    console.log('  - Password valid:', isValidPassword ? '✅' : '❌')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCredentials()
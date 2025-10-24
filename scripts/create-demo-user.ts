import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createDemoUser() {
  try {
    console.log('Creating demo user...')

    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@onelp.capital' }
    })

    if (existingUser) {
      console.log('Demo user already exists!')
      console.log('Email: demo@onelp.capital')
      console.log('Password: demo123')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 12)

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@onelp.capital',
        name: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        password: hashedPassword,
        role: 'USER',
        mfaEnabled: false, // Explicitly disable MFA for demo
        emailVerified: new Date(),
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    })

    console.log('✅ Demo user created successfully!')
    console.log('📧 Email: demo@onelp.capital')
    console.log('🔑 Password: demo123')
    console.log('👤 Role: USER')
    console.log('🔒 MFA: Disabled (for demo purposes)')

    // Create some sample fund access for demo
    const sampleFund = await prisma.fund.create({
      data: {
        name: 'Demo Fund',
        description: 'A sample fund for demonstration purposes',
        nav: 100.50,
        totalValue: 1000000,
        userId: demoUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create fund access for demo user
    await prisma.fundAccess.create({
      data: {
        userId: demoUser.id,
        fundId: sampleFund.id,
        accessLevel: 'FULL',
        grantedAt: new Date(),
        grantedBy: demoUser.id
      }
    })

    console.log('📊 Sample fund created and assigned to demo user')

  } catch (error) {
    console.error('❌ Error creating demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createDemoUser()

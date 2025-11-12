import { PrismaClient } from '@prisma/client'
import { seed, prisma as seedPrisma } from '../prisma/seed'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Cleaning database...')

  // Delete in order to respect foreign key constraints
  // Start with dependent tables first
  // Use try-catch for each to handle cases where models might not exist
  const deleteOperations = [
    () => prisma.navHistory.deleteMany({}),
    () => prisma.document.deleteMany({}),
    () => prisma.directInvestmentDocument.deleteMany({}),
    () => prisma.directInvestment.deleteMany({}),
    () => prisma.fundAccess.deleteMany({}),
    () => prisma.auditLog.deleteMany({}),
    () => prisma.securityEvent.deleteMany({}),
    () => prisma.userSession.deleteMany({}),
    () => prisma.mFASettings.deleteMany({}),
    () => prisma.mFAToken.deleteMany({}),
    () => prisma.passwordReset.deleteMany({}),
    () => prisma.invitation.deleteMany({}),
    // Then delete main entities
    () => prisma.fund.deleteMany({}),
    () => prisma.client.deleteMany({}),
    () => prisma.user.deleteMany({}),
  ]

  for (const operation of deleteOperations) {
    try {
      await operation()
    } catch (error: any) {
      // If model doesn't exist or is undefined, skip it
      if (error?.message?.includes('undefined') || error?.message?.includes('Cannot read')) {
        console.warn(`⚠️  Skipping model (may not exist): ${error.message}`)
        continue
      }
      throw error
    }
  }

  console.log('✅ Database cleaned')
}

async function main() {
  try {
    await cleanDatabase()
    console.log('\n🌱 Running seed script...')
    
    // Run the seed function
    await seed()
    
    console.log('\n✨ Beta seed refresh completed successfully!')
  } catch (error) {
    console.error('❌ Beta seed refresh failed:', error)
    process.exit(1)
  } finally {
    // Disconnect both Prisma clients
    await seedPrisma.$disconnect()
    await prisma.$disconnect()
  }
}

main()


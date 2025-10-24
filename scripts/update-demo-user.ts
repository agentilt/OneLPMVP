import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDemoUser() {
  try {
    console.log('Updating demo user email...')

    // Find the existing demo user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo@onelp.com' },
          { email: 'demo@example.com' }
        ]
      }
    })

    if (!existingUser) {
      console.log('No existing demo user found with old email addresses')
      return
    }

    console.log(`Found demo user: ${existingUser.email}`)

    // Update the email to the consistent format
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: 'demo@onelp.capital',
        mfaEnabled: false, // Ensure MFA is disabled for demo
      }
    })

    console.log('✅ Demo user updated successfully!')
    console.log('📧 New email: demo@onelp.capital')
    console.log('🔑 Password: demo123 (unchanged)')
    console.log('🔒 MFA: Disabled')

  } catch (error) {
    console.error('❌ Error updating demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateDemoUser()

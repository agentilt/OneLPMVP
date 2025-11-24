import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe123!'
  const firstName = process.env.ADMIN_SEED_FIRST_NAME || 'Platform'
  const lastName = process.env.ADMIN_SEED_LAST_NAME || 'Admin'
  const clientName = process.env.ADMIN_SEED_CLIENT || 'OneLP Admin Client'

  console.log('🛠  Admin seed starting...')
  console.log(`→ Target email: ${email}`)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('ℹ️  User already exists, skipping creation')
    return
  }

  const client =
    (await prisma.client.findFirst({ where: { name: clientName } })) ||
    (await prisma.client.create({ data: { name: clientName } }))

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      role: 'ADMIN',
      clientId: client.id,
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  console.log('✅ Admin user created')
  console.log(`   Email: ${user.email}`)
  console.log(`   Temp Password: ${password}`)
  console.log('   (Update immediately after login)')
}

main()
  .catch((error) => {
    console.error('❌ Admin seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


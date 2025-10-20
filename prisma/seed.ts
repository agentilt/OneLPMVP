import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eurolp.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'SecurePassword123!'
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12)
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Created admin user: ${admin.email}`)

  // Create data manager user
  const dataManagerPassword = await bcrypt.hash('manager123', 12)
  const dataManager = await prisma.user.upsert({
    where: { email: 'manager@eurolp.com' },
    update: {},
    create: {
      email: 'manager@eurolp.com',
      name: 'Data Manager',
      password: dataManagerPassword,
      role: 'DATA_MANAGER',
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Created data manager user: ${dataManager.email}`)

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@eurolp.com' },
    update: {},
    create: {
      email: 'demo@eurolp.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Created demo user: ${demoUser.email}`)

  // Create sample funds (now directly owned by users)
  const fund1 = await prisma.fund.upsert({
    where: { id: 'fund-1' },
    update: {},
    create: {
      id: 'fund-1',
      userId: demoUser.id,  // Fund now belongs to demo user
      name: 'European Ventures Fund I',
      domicile: 'Luxembourg',
      vintage: 2020,
      manager: 'EuroVC Partners',
      commitment: 5000000,
      paidIn: 3500000,
      nav: 4200000,
      irr: 18.5,
      tvpi: 1.20,
      dpi: 0.15,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const fund2 = await prisma.fund.upsert({
    where: { id: 'fund-2' },
    update: {},
    create: {
      id: 'fund-2',
      userId: demoUser.id,  // Fund now belongs to demo user
      name: 'Tech Growth Fund II',
      domicile: 'Ireland',
      vintage: 2021,
      manager: 'Atlantic Capital',
      commitment: 3000000,
      paidIn: 2100000,
      nav: 2800000,
      irr: 22.3,
      tvpi: 1.33,
      dpi: 0.10,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const fund3 = await prisma.fund.upsert({
    where: { id: 'fund-3' },
    update: {},
    create: {
      id: 'fund-3',
      userId: demoUser.id,  // Fund now belongs to demo user
      name: 'Nordic Innovation Fund',
      domicile: 'Sweden',
      vintage: 2019,
      manager: 'Nordic Ventures',
      commitment: 2000000,
      paidIn: 1800000,
      nav: 2600000,
      irr: 25.7,
      tvpi: 1.44,
      dpi: 0.30,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  console.log(`✅ Created ${3} sample funds for demo user`)

  // Create NAV history for fund1
  const navHistoryData = [
    { date: new Date('2024-03-31'), nav: 3800000 },
    { date: new Date('2024-06-30'), nav: 4000000 },
    { date: new Date('2024-09-30'), nav: 4200000 },
  ]

  for (const data of navHistoryData) {
    await prisma.navHistory.create({
      data: {
        fundId: fund1.id,
        date: data.date,
        nav: data.nav,
      },
    })
  }

  console.log(`✅ Created NAV history for ${fund1.name}`)

  // Create sample documents
  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call Notice - Q4 2024',
      uploadDate: new Date('2024-10-01'),
      dueDate: new Date('2024-10-31'),
      callAmount: 500000,
      paymentStatus: 'PENDING',
      url: '/assets/documents/capital-call-sample.pdf',
      parsedData: {
        notice: 'Fourth capital call for investment in Portfolio Company XYZ',
        amount: 500000,
        dueDate: '2024-10-31',
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'QUARTERLY_REPORT',
      title: 'Q3 2024 Quarterly Report',
      uploadDate: new Date('2024-10-15'),
      url: '/assets/documents/q3-2024-report.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        highlights: 'Strong performance across portfolio companies',
      },
    },
  })

  // Create documents for fund2 (Atlantic Capital)
  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'QUARTERLY_REPORT',
      title: 'Atlantic Capital Q3 2024 Investor Report',
      uploadDate: new Date('2024-10-15'),
      url: '/uploads/documents/Atlantic_Capital_Q3_2024_Investor_Report_Demo.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        fund: 'Atlantic Capital',
        reportType: 'Investor Report',
      },
    },
  })

  // Create documents for fund3 (Nordic Innovation Fund)
  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'QUARTERLY_REPORT',
      title: 'Nordic Innovation Fund Capital Account Statement Q3 2024',
      uploadDate: new Date('2024-10-15'),
      url: '/uploads/documents/Nordic_Innovation_Fund_Capital_Account_Statement_Q3_2024_Demo.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        fund: 'Nordic Innovation Fund',
        reportType: 'Capital Account Statement',
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'CAPITAL_CALL',
      title: 'Nordic Innovation Fund Distribution Notice Q3 2024',
      uploadDate: new Date('2024-10-15'),
      url: '/uploads/documents/Nordic_Innovation_Fund_Distribution_Notice_Q3_2024_Demo.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        fund: 'Nordic Innovation Fund',
        reportType: 'Distribution Notice',
      },
    },
  })

  console.log(`✅ Created sample documents`)

  // Create sample crypto holdings for demo user
  await prisma.cryptoHolding.createMany({
    data: [
      {
        userId: demoUser.id,
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 0.5,
        valueUsd: 32500,
      },
      {
        userId: demoUser.id,
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 5.0,
        valueUsd: 12500,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Created crypto holdings for demo user`)

  console.log('✨ Seed completed successfully!')
  console.log('\n📝 Login credentials:')
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`)
  console.log(`   Demo:  demo@eurolp.com / demo123`)
  console.log(`   Data Manager: manager@eurolp.com / manager123`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


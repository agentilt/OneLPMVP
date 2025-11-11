import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

export const prisma = new PrismaClient()

// Stable IDs for automated tests - exported for use in tests
export const STABLE_IDS = {
  users: {
    admin: 'user-admin-001',
    dataManager: 'user-manager-001',
    demo: 'user-demo-001',
    beta1: 'user-beta-001',
    beta2: 'user-beta-002',
    beta3: 'user-beta-003',
  },
  clients: {
    client1: 'client-001',
    client2: 'client-002',
    client3: 'client-003',
  },
  funds: {
    fund1: 'fund-001',
    fund2: 'fund-002',
    fund3: 'fund-003',
    fund4: 'fund-004',
    fund5: 'fund-005',
    fund6: 'fund-006',
  },
  documents: {
    doc1: 'doc-001',
    doc2: 'doc-002',
    doc3: 'doc-003',
    doc4: 'doc-004',
    doc5: 'doc-005',
    doc6: 'doc-006',
    doc7: 'doc-007',
    doc8: 'doc-008',
    doc9: 'doc-009',
    doc10: 'doc-010',
  },
}

export async function seed() {
  console.log('🌱 Starting database seed...')

  // Hash passwords once
  const adminPassword = process.env.ADMIN_PASSWORD || 'SecurePassword123!'
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12)
  const hashedDemoPassword = await bcrypt.hash('demo123', 12)
  const hashedManagerPassword = await bcrypt.hash('manager123', 12)
  const hashedBetaPassword = await bcrypt.hash('beta123', 12)

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@onelp.com'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: STABLE_IDS.users.admin,
      email: adminEmail,
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedAdminPassword,
      role: 'ADMIN',
      emailVerified: new Date('2024-01-01'),
      termsAcceptedAt: new Date('2024-01-01'),
      privacyAcceptedAt: new Date('2024-01-01'),
    },
  })
  console.log(`✅ Created admin user: ${admin.email}`)

  // Create data manager user
  const dataManager = await prisma.user.upsert({
    where: { email: 'manager@onelp.com' },
    update: {},
    create: {
      id: STABLE_IDS.users.dataManager,
      email: 'manager@onelp.com',
      name: 'Data Manager',
      firstName: 'Data',
      lastName: 'Manager',
      password: hashedManagerPassword,
      role: 'DATA_MANAGER',
      emailVerified: new Date('2024-01-01'),
      termsAcceptedAt: new Date('2024-01-01'),
      privacyAcceptedAt: new Date('2024-01-01'),
    },
  })
  console.log(`✅ Created data manager user: ${dataManager.email}`)

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@onelp.com' },
    update: {},
    create: {
      id: STABLE_IDS.users.demo,
      email: 'demo@onelp.com',
      name: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
      password: hashedDemoPassword,
      role: 'USER',
      emailVerified: new Date('2024-01-01'),
      termsAcceptedAt: new Date('2024-01-01'),
      privacyAcceptedAt: new Date('2024-01-01'),
    },
  })
  console.log(`✅ Created demo user: ${demoUser.email}`)

  // Create beta users
  const betaUser1 = await prisma.user.upsert({
    where: { email: 'beta1@onelp.com' },
    update: {},
    create: {
      id: STABLE_IDS.users.beta1,
      email: 'beta1@onelp.com',
      name: 'Beta User One',
      firstName: 'Beta',
      lastName: 'One',
      password: hashedBetaPassword,
      role: 'USER',
      emailVerified: new Date('2024-01-15'),
      termsAcceptedAt: new Date('2024-01-15'),
      privacyAcceptedAt: new Date('2024-01-15'),
    },
  })

  const betaUser2 = await prisma.user.upsert({
    where: { email: 'beta2@onelp.com' },
    update: {},
    create: {
      id: STABLE_IDS.users.beta2,
      email: 'beta2@onelp.com',
      name: 'Beta User Two',
      firstName: 'Beta',
      lastName: 'Two',
      password: hashedBetaPassword,
      role: 'USER',
      emailVerified: new Date('2024-01-20'),
      termsAcceptedAt: new Date('2024-01-20'),
      privacyAcceptedAt: new Date('2024-01-20'),
    },
  })

  const betaUser3 = await prisma.user.upsert({
    where: { email: 'beta3@onelp.com' },
    update: {},
    create: {
      id: STABLE_IDS.users.beta3,
      email: 'beta3@onelp.com',
      name: 'Beta User Three',
      firstName: 'Beta',
      lastName: 'Three',
      password: hashedBetaPassword,
      role: 'USER',
      emailVerified: new Date('2024-02-01'),
      termsAcceptedAt: new Date('2024-02-01'),
      privacyAcceptedAt: new Date('2024-02-01'),
    },
  })
  console.log(`✅ Created ${3} beta users`)

  // Create clients
  const client1 = await prisma.client.upsert({
    where: { id: STABLE_IDS.clients.client1 },
    update: {},
    create: {
      id: STABLE_IDS.clients.client1,
      name: 'Acme Capital Partners',
      email: 'contact@acmecapital.com',
      phone: '+44 20 7123 4567',
      address: '123 Financial District, London, UK',
      notes: 'Primary investment client with focus on European tech',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: STABLE_IDS.clients.client2 },
    update: {},
    create: {
      id: STABLE_IDS.clients.client2,
      name: 'Nordic Ventures LLC',
      email: 'info@nordicventures.se',
      phone: '+46 8 123 4567',
      address: 'Stockholm Business Center, Stockholm, Sweden',
      notes: 'Nordic-focused investment firm',
    },
  })

  const client3 = await prisma.client.upsert({
    where: { id: STABLE_IDS.clients.client3 },
    update: {},
    create: {
      id: STABLE_IDS.clients.client3,
      name: 'Atlantic Investment Group',
      email: 'hello@atlanticinvest.com',
      phone: '+353 1 234 5678',
      address: 'Dublin Financial Hub, Dublin, Ireland',
      notes: 'Cross-border investment management',
    },
  })
  console.log(`✅ Created ${3} clients`)

  // Create funds for demo user
  const fund1 = await prisma.fund.upsert({
    where: { id: STABLE_IDS.funds.fund1 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund1,
      userId: demoUser.id,
      name: 'European Ventures Fund I',
      domicile: 'Luxembourg',
      vintage: 2020,
      manager: 'EuroVC Partners',
      managerEmail: 'contact@eurovc.com',
      managerPhone: '+352 27 123 456',
      managerWebsite: 'https://eurovc.com',
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
    where: { id: STABLE_IDS.funds.fund2 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund2,
      userId: demoUser.id,
      name: 'Tech Growth Fund II',
      domicile: 'Ireland',
      vintage: 2021,
      manager: 'Atlantic Capital',
      managerEmail: 'info@atlanticcapital.com',
      managerPhone: '+353 1 234 5678',
      managerWebsite: 'https://atlanticcapital.com',
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
    where: { id: STABLE_IDS.funds.fund3 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund3,
      userId: demoUser.id,
      name: 'Nordic Innovation Fund',
      domicile: 'Sweden',
      vintage: 2019,
      manager: 'Nordic Ventures',
      managerEmail: 'contact@nordicventures.se',
      managerPhone: '+46 8 123 4567',
      managerWebsite: 'https://nordicventures.se',
      commitment: 2000000,
      paidIn: 1800000,
      nav: 2600000,
      irr: 25.7,
      tvpi: 1.44,
      dpi: 0.30,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  // Create funds for beta users and clients
  const fund4 = await prisma.fund.upsert({
    where: { id: STABLE_IDS.funds.fund4 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund4,
      userId: betaUser1.id,
      clientId: client1.id,
      name: 'Acme Growth Fund III',
      domicile: 'United Kingdom',
      vintage: 2022,
      manager: 'Acme Capital Partners',
      managerEmail: 'contact@acmecapital.com',
      managerPhone: '+44 20 7123 4567',
      managerWebsite: 'https://acmecapital.com',
      commitment: 7500000,
      paidIn: 6000000,
      nav: 7200000,
      irr: 15.2,
      tvpi: 1.20,
      dpi: 0.08,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const fund5 = await prisma.fund.upsert({
    where: { id: STABLE_IDS.funds.fund5 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund5,
      userId: betaUser2.id,
      clientId: client2.id,
      name: 'Nordic Deep Tech Fund',
      domicile: 'Sweden',
      vintage: 2023,
      manager: 'Nordic Ventures LLC',
      managerEmail: 'info@nordicventures.se',
      managerPhone: '+46 8 123 4567',
      managerWebsite: 'https://nordicventures.se',
      commitment: 4000000,
      paidIn: 2500000,
      nav: 2800000,
      irr: 12.8,
      tvpi: 1.12,
      dpi: 0.05,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const fund6 = await prisma.fund.upsert({
    where: { id: STABLE_IDS.funds.fund6 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund6,
      userId: betaUser3.id,
      clientId: client3.id,
      name: 'Atlantic Early Stage Fund',
      domicile: 'Ireland',
      vintage: 2021,
      manager: 'Atlantic Investment Group',
      managerEmail: 'hello@atlanticinvest.com',
      managerPhone: '+353 1 234 5678',
      managerWebsite: 'https://atlanticinvest.com',
      commitment: 2500000,
      paidIn: 2000000,
      nav: 2400000,
      irr: 19.4,
      tvpi: 1.20,
      dpi: 0.12,
      lastReportDate: new Date('2024-09-30'),
    },
  })
  console.log(`✅ Created ${6} funds`)

  // Create NAV history for funds
  const navHistoryData = [
    // Fund 1
    { fundId: fund1.id, date: new Date('2024-03-31'), nav: 3800000 },
    { fundId: fund1.id, date: new Date('2024-06-30'), nav: 4000000 },
    { fundId: fund1.id, date: new Date('2024-09-30'), nav: 4200000 },
    // Fund 2
    { fundId: fund2.id, date: new Date('2024-03-31'), nav: 2500000 },
    { fundId: fund2.id, date: new Date('2024-06-30'), nav: 2650000 },
    { fundId: fund2.id, date: new Date('2024-09-30'), nav: 2800000 },
    // Fund 3
    { fundId: fund3.id, date: new Date('2024-03-31'), nav: 2400000 },
    { fundId: fund3.id, date: new Date('2024-06-30'), nav: 2500000 },
    { fundId: fund3.id, date: new Date('2024-09-30'), nav: 2600000 },
    // Fund 4
    { fundId: fund4.id, date: new Date('2024-06-30'), nav: 6800000 },
    { fundId: fund4.id, date: new Date('2024-09-30'), nav: 7200000 },
    // Fund 5
    { fundId: fund5.id, date: new Date('2024-06-30'), nav: 2600000 },
    { fundId: fund5.id, date: new Date('2024-09-30'), nav: 2800000 },
    // Fund 6
    { fundId: fund6.id, date: new Date('2024-03-31'), nav: 2200000 },
    { fundId: fund6.id, date: new Date('2024-06-30'), nav: 2300000 },
    { fundId: fund6.id, date: new Date('2024-09-30'), nav: 2400000 },
  ]

  // Delete existing NAV history and create new
  await prisma.navHistory.deleteMany({})
  await prisma.navHistory.createMany({
    data: navHistoryData,
    skipDuplicates: true,
  })
  console.log(`✅ Created NAV history for ${6} funds`)

  // Create documents
  // Delete existing documents first
  await prisma.document.deleteMany({})

  // Documents for fund1
  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc1,
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
      id: STABLE_IDS.documents.doc2,
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

  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc3,
      fundId: fund1.id,
      type: 'ANNUAL_REPORT',
      title: 'Annual Report 2023',
      uploadDate: new Date('2024-03-31'),
      url: '/assets/documents/annual-report-2023.pdf',
      parsedData: {
        year: '2023',
        summary: 'Annual performance review and portfolio update',
      },
    },
  })

  // Documents for fund2
  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc4,
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

  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc5,
      fundId: fund2.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call - Q3 2024',
      uploadDate: new Date('2024-09-01'),
      dueDate: new Date('2024-09-30'),
      callAmount: 300000,
      paymentStatus: 'PAID',
      url: '/assets/documents/capital-call-q3-2024.pdf',
      parsedData: {
        amount: 300000,
        status: 'PAID',
      },
    },
  })

  // Documents for fund3
  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc6,
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
      id: STABLE_IDS.documents.doc7,
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

  // Documents for fund4
  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc8,
      fundId: fund4.id,
      type: 'QUARTERLY_REPORT',
      title: 'Acme Growth Fund III - Q3 2024 Report',
      uploadDate: new Date('2024-10-10'),
      url: '/assets/documents/acme-q3-2024.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        fund: 'Acme Growth Fund III',
      },
    },
  })

  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc9,
      fundId: fund4.id,
      type: 'KYC',
      title: 'KYC Documentation - Acme Growth Fund III',
      uploadDate: new Date('2024-08-01'),
      url: '/assets/documents/kyc-acme-fund3.pdf',
      parsedData: {
        type: 'KYC',
        status: 'COMPLETED',
      },
    },
  })

  // Documents for fund5
  await prisma.document.create({
    data: {
      id: STABLE_IDS.documents.doc10,
      fundId: fund5.id,
      type: 'QUARTERLY_REPORT',
      title: 'Nordic Deep Tech Fund - Q3 2024 Update',
      uploadDate: new Date('2024-10-12'),
      url: '/assets/documents/nordic-deep-tech-q3-2024.pdf',
      parsedData: {
        quarter: 'Q3 2024',
        fund: 'Nordic Deep Tech Fund',
      },
    },
  })

  console.log(`✅ Created ${10} documents`)

  // Create FundAccess relationships
  await prisma.fundAccess.deleteMany({})

  // Demo user has access to their own funds (via ownership, but also via FundAccess for testing)
  await prisma.fundAccess.create({
    data: {
      userId: demoUser.id,
      fundId: fund1.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_WRITE',
      notes: 'Primary fund owner',
    },
  })

  // Beta users have access to some shared funds
  await prisma.fundAccess.create({
    data: {
      userId: betaUser1.id,
      fundId: fund4.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_WRITE',
    },
  })

  await prisma.fundAccess.create({
    data: {
      userId: betaUser2.id,
      fundId: fund5.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_WRITE',
    },
  })

  await prisma.fundAccess.create({
    data: {
      userId: betaUser3.id,
      fundId: fund6.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_WRITE',
    },
  })

  // Admin has read access to all funds
  await prisma.fundAccess.createMany({
    data: [
      { userId: admin.id, fundId: fund1.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
      { userId: admin.id, fundId: fund2.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
      { userId: admin.id, fundId: fund3.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
      { userId: admin.id, fundId: fund4.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
      { userId: admin.id, fundId: fund5.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
      { userId: admin.id, fundId: fund6.id, relationshipType: 'INTERNAL_ADMIN', permissionLevel: 'ADMIN' },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Created FundAccess relationships`)

  // Create sample crypto holdings for demo user
  await prisma.cryptoHolding.deleteMany({})
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
      {
        userId: betaUser1.id,
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 1.2,
        valueUsd: 78000,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Created crypto holdings`)

  console.log('\n✨ Seed completed successfully!')
  console.log('\n📝 Login credentials:')
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`)
  console.log(`   Demo:  demo@onelp.com / demo123`)
  console.log(`   Data Manager: manager@onelp.com / manager123`)
  console.log(`   Beta Users: beta1@onelp.com, beta2@onelp.com, beta3@onelp.com / beta123`)
  console.log('\n🔑 Stable IDs for automated tests:')
  console.log(`   Users: ${Object.values(STABLE_IDS.users).join(', ')}`)
  console.log(`   Funds: ${Object.values(STABLE_IDS.funds).join(', ')}`)
  console.log(`   Documents: ${Object.values(STABLE_IDS.documents).join(', ')}`)
}

// Only run if called directly (not imported)
if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('❌ Seed failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

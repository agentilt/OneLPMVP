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
    doc11: 'doc-011',
    doc12: 'doc-012',
    doc13: 'doc-013',
    doc14: 'doc-014',
    doc15: 'doc-015',
    doc16: 'doc-016',
    doc17: 'doc-017',
  },
  directInvestments: {
    di1: 'di-001',
    di2: 'di-002',
    di3: 'di-003',
    di4: 'di-004',
    di5: 'di-005',
    di6: 'di-006',
  },
  directInvestmentDocuments: {
    did1: 'did-001',
    did2: 'did-002',
    did3: 'did-003',
    did4: 'did-004',
    did5: 'did-005',
    did6: 'did-006',
    did7: 'did-007',
    did8: 'did-008',
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

  // Create clients FIRST (before assigning users to them)
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

  // Create admin user (no client assignment - system user)
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
      // Admin users don't need clientId
    },
  })
  console.log(`✅ Created admin user: ${admin.email}`)

  // Create data manager user (no client assignment - system user)
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
      // Data managers don't need clientId
    },
  })
  console.log(`✅ Created data manager user: ${dataManager.email}`)

  // Create demo user (assigned to client1)
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
      clientId: client1.id, // Assign to client1
      emailVerified: new Date('2024-01-01'),
      termsAcceptedAt: new Date('2024-01-01'),
      privacyAcceptedAt: new Date('2024-01-01'),
    },
  })
  console.log(`✅ Created demo user: ${demoUser.email}`)

  // Create beta users (each assigned to a different client)
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
      clientId: client1.id, // Assign to client1
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
      clientId: client2.id, // Assign to client2
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
      clientId: client3.id, // Assign to client3
      emailVerified: new Date('2024-02-01'),
      termsAcceptedAt: new Date('2024-02-01'),
      privacyAcceptedAt: new Date('2024-02-01'),
    },
  })
  console.log(`✅ Created ${3} beta users`)

  // Create funds for demo user
  const fund1 = await prisma.fund.upsert({
    where: { id: STABLE_IDS.funds.fund1 },
    update: {},
    create: {
      id: STABLE_IDS.funds.fund1,
      userId: demoUser.id,
      clientId: client1.id, // Assign to client1
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
      clientId: client1.id, // Assign to client1
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
      clientId: client1.id, // Assign to client1
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

  const documentsData = [
    {
      id: STABLE_IDS.documents.doc1,
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
    },
    {
      id: STABLE_IDS.documents.doc2,
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
    },
    {
      id: STABLE_IDS.documents.doc3,
      data: {
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
    },
    {
      id: STABLE_IDS.documents.doc4,
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
    },
    {
      id: STABLE_IDS.documents.doc5,
      data: {
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
    },
    {
      id: STABLE_IDS.documents.doc6,
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
    },
    {
      id: STABLE_IDS.documents.doc7,
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
    },
    {
      id: STABLE_IDS.documents.doc8,
      data: {
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
    },
    {
      id: STABLE_IDS.documents.doc9,
      data: {
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
    },
    {
      id: STABLE_IDS.documents.doc10,
      data: {
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
    },
    {
      id: STABLE_IDS.documents.doc11,
      data: {
        fundId: fund4.id,
        type: 'ANNUAL_REPORT',
        title: 'Acme Growth Fund III - Annual Report 2023',
        uploadDate: new Date('2024-04-15'),
        url: '/assets/documents/acme-annual-2023.pdf',
        parsedData: {
          year: '2023',
          fund: 'Acme Growth Fund III',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc12,
      data: {
        fundId: fund4.id,
        type: 'CAPITAL_CALL',
        title: 'Capital Call Notice - Q4 2024',
        uploadDate: new Date('2024-10-05'),
        dueDate: new Date('2024-11-15'),
        callAmount: 750000,
        paymentStatus: 'PENDING',
        url: '/assets/documents/acme-capital-call-q4.pdf',
        parsedData: {
          amount: 750000,
          dueDate: '2024-11-15',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc13,
      data: {
        fundId: fund5.id,
        type: 'CAPITAL_CALL',
        title: 'Capital Call - Q3 2024',
        uploadDate: new Date('2024-09-15'),
        dueDate: new Date('2024-10-15'),
        callAmount: 400000,
        paymentStatus: 'PAID',
        url: '/assets/documents/nordic-capital-call-q3.pdf',
        parsedData: {
          amount: 400000,
          status: 'PAID',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc14,
      data: {
        fundId: fund5.id,
        type: 'COMPLIANCE',
        title: 'Compliance Report - Q3 2024',
        uploadDate: new Date('2024-10-01'),
        url: '/assets/documents/nordic-compliance-q3.pdf',
        parsedData: {
          quarter: 'Q3 2024',
          type: 'COMPLIANCE',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc15,
      data: {
        fundId: fund6.id,
        type: 'QUARTERLY_REPORT',
        title: 'Atlantic Early Stage Fund - Q3 2024 Report',
        uploadDate: new Date('2024-10-10'),
        url: '/assets/documents/atlantic-q3-2024.pdf',
        parsedData: {
          quarter: 'Q3 2024',
          fund: 'Atlantic Early Stage Fund',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc16,
      data: {
        fundId: fund6.id,
        type: 'CAPITAL_CALL',
        title: 'Capital Call Notice - Q3 2024',
        uploadDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-30'),
        callAmount: 250000,
        paymentStatus: 'PAID',
        url: '/assets/documents/atlantic-capital-call-q3.pdf',
        parsedData: {
          amount: 250000,
          status: 'PAID',
        },
      },
    },
    {
      id: STABLE_IDS.documents.doc17,
      data: {
        fundId: fund6.id,
        type: 'ANNUAL_REPORT',
        title: 'Atlantic Early Stage Fund - Annual Report 2023',
        uploadDate: new Date('2024-03-31'),
        url: '/assets/documents/atlantic-annual-2023.pdf',
        parsedData: {
          year: '2023',
          fund: 'Atlantic Early Stage Fund',
        },
      },
    },
  ]

  for (const { id, data } of documentsData) {
    await prisma.document.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    })
  }

  console.log(`✅ Upserted ${documentsData.length} documents`)

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

  // Create direct investments for demo and beta users
  await prisma.directInvestmentDocument.deleteMany({})
  await prisma.directInvestment.deleteMany({})

  // Direct investments for demo user
  const di1 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di1,
      userId: demoUser.id,
      name: 'TechFlow Solutions',
      industry: 'SaaS',
      stage: 'Series A',
      investmentDate: new Date('2023-06-15'),
      investmentAmount: 2500000,
      // Aggregated fields will be set from documents
      revenue: 10850000, // ARR (10.2M) + non-recurring revenue (650k)
      arr: 10200000,
      mrr: 850000,
      grossMargin: 78.5,
      runRate: 10200000,
      burn: 450000,
      runway: 18,
      headcount: 45,
      cac: 1200,
      ltv: 36000,
      nrr: 115,
      cashBalance: 8100000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'Strong customer growth with 25% MoM increase. Launched new enterprise tier.',
      lowlights: 'Customer churn slightly increased in SMB segment.',
      milestones: 'Reached $10M ARR milestone. Hired VP of Sales.',
      recentRounds: 'Series A closed at $25M valuation.',
      capTableChanges: 'New investor joined cap table.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const di2 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di2,
      userId: demoUser.id,
      name: 'GreenEnergy Innovations',
      industry: 'CleanTech',
      stage: 'Series B',
      investmentDate: new Date('2022-11-20'),
      investmentAmount: 5000000,
      revenue: 39400000, // ARR (38.4M) + non-recurring revenue (1M)
      arr: 38400000,
      mrr: 3200000,
      grossMargin: 65.2,
      runRate: 38400000,
      burn: 1200000,
      runway: 24,
      headcount: 120,
      cac: 3500,
      ltv: 84000,
      nrr: 108,
      cashBalance: 28800000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'Major contract signed with European utility company. Product expansion successful.',
      lowlights: 'Regulatory approval delays in one market.',
      milestones: 'Reached $30M ARR. Expanded to 3 new markets.',
      recentRounds: 'Series B extension raised additional $15M.',
      capTableChanges: 'Strategic investor added.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  // Direct investments for beta users
  const di3 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di3,
      userId: betaUser1.id,
      clientId: client1.id,
      name: 'DataVault Analytics',
      industry: 'Data Analytics',
      stage: 'Seed',
      investmentDate: new Date('2024-01-10'),
      investmentAmount: 1500000,
      revenue: 2460000, // ARR (2.16M) + non-recurring revenue (300k)
      arr: 2160000,
      mrr: 180000,
      grossMargin: 82.0,
      runRate: 2160000,
      burn: 280000,
      runway: 12,
      headcount: 18,
      cac: 800,
      ltv: 24000,
      nrr: 125,
      cashBalance: 3360000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'Strong product-market fit. Customer NPS score of 72.',
      lowlights: 'Need to improve sales cycle length.',
      milestones: 'Launched AI-powered analytics features. Reached 50 customers.',
      recentRounds: 'Seed round completed successfully.',
      capTableChanges: 'Angel investors joined.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const di4 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di4,
      userId: betaUser2.id,
      clientId: client2.id,
      name: 'MediCare AI',
      industry: 'HealthTech',
      stage: 'Series A',
      investmentDate: new Date('2023-09-05'),
      investmentAmount: 3000000,
      revenue: 6740000, // ARR (6.24M) + non-recurring revenue (500k)
      arr: 6240000,
      mrr: 520000,
      grossMargin: 70.5,
      runRate: 6240000,
      burn: 380000,
      runway: 16,
      headcount: 32,
      cac: 2500,
      ltv: 60000,
      nrr: 110,
      cashBalance: 6080000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'FDA approval received for core product. Partnership with major hospital network.',
      lowlights: 'Regulatory compliance costs higher than expected.',
      milestones: 'Reached $5M ARR. Completed clinical trials.',
      recentRounds: 'Series A closed at $30M valuation.',
      capTableChanges: 'Healthcare-focused VC joined.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const di5 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di5,
      userId: betaUser3.id,
      clientId: client3.id,
      name: 'FinTech Pro',
      industry: 'FinTech',
      stage: 'Series B',
      investmentDate: new Date('2022-03-12'),
      investmentAmount: 7500000,
      revenue: 26200000, // ARR (25.2M) + non-recurring revenue (1M)
      arr: 25200000,
      mrr: 2100000,
      grossMargin: 75.8,
      runRate: 25200000,
      burn: 950000,
      runway: 20,
      headcount: 85,
      cac: 1800,
      ltv: 54000,
      nrr: 112,
      cashBalance: 19000000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'Expanded to 5 new markets. Strong enterprise sales growth.',
      lowlights: 'Competition intensifying in core market.',
      milestones: 'Reached $20M ARR. Launched international expansion.',
      recentRounds: 'Series B raised $75M.',
      capTableChanges: 'Strategic financial services investor added.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  const di6 = await prisma.directInvestment.create({
    data: {
      id: STABLE_IDS.directInvestments.di6,
      userId: demoUser.id,
      name: 'CloudSecure Platform',
      industry: 'Cybersecurity',
      stage: 'Series A',
      investmentDate: new Date('2023-12-01'),
      investmentAmount: 4000000,
      revenue: 8100000, // ARR (7.8M) + non-recurring revenue (300k)
      arr: 7800000,
      mrr: 650000,
      grossMargin: 80.2,
      runRate: 7800000,
      burn: 420000,
      runway: 15,
      headcount: 38,
      cac: 1500,
      ltv: 45000,
      nrr: 118,
      cashBalance: 6300000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: 'Strong security certifications achieved. Enterprise customer wins.',
      lowlights: 'Sales cycle longer than expected.',
      milestones: 'Reached $7M ARR. SOC 2 Type II certified.',
      recentRounds: 'Series A closed at $40M valuation.',
      capTableChanges: 'Cybersecurity-focused investor joined.',
      lastReportDate: new Date('2024-09-30'),
    },
  })

  console.log(`✅ Created ${6} direct investments`)

  // Create direct investment documents with metrics
  const directInvestmentDocumentsData = [
    {
      id: STABLE_IDS.directInvestmentDocuments.did1,
      data: {
        directInvestmentId: di1.id,
        type: 'INVESTOR_UPDATE',
        title: 'TechFlow Solutions - Q3 2024 Investor Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/techflow-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'Strong customer growth with 25% MoM increase. Launched new enterprise tier.',
        lowlights: 'Customer churn slightly increased in SMB segment.',
        milestones: 'Reached $10M ARR milestone. Hired VP of Sales.',
        recentRounds: 'Series A closed at $25M valuation.',
        capTableChanges: 'New investor joined cap table.',
        revenue: 10850000, // ARR (10.2M) + non-recurring revenue (650k)
        arr: 10200000,
        mrr: 850000,
        grossMargin: 78.5,
        runRate: 10200000,
        burn: 450000,
        runway: 18,
        headcount: 45,
        cac: 1200,
        ltv: 36000,
        nrr: 115,
        cashBalance: 8100000,
        parsedData: {
          quarter: 'Q3 2024',
          metrics: 'strong',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did2,
      data: {
        directInvestmentId: di1.id,
        type: 'EXECUTIVE_SUMMARY',
        title: 'TechFlow Solutions - Q2 2024 Executive Summary',
        uploadDate: new Date('2024-06-30'),
        url: '/assets/documents/techflow-q2-2024-exec.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-06-30'),
        highlights: 'Product launch successful. Customer acquisition accelerating.',
        revenue: 9240000, // ARR (8.64M) + non-recurring revenue (600k)
        arr: 8640000,
        mrr: 720000,
        grossMargin: 77.0,
        headcount: 38,
        parsedData: {
          quarter: 'Q2 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did3,
      data: {
        directInvestmentId: di2.id,
        type: 'INVESTOR_UPDATE',
        title: 'GreenEnergy Innovations - Q3 2024 Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/greenenergy-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'Major contract signed with European utility company. Product expansion successful.',
        lowlights: 'Regulatory approval delays in one market.',
        milestones: 'Reached $30M ARR. Expanded to 3 new markets.',
        revenue: 39400000, // ARR (38.4M) + non-recurring revenue (1M)
        arr: 38400000,
        mrr: 3200000,
        grossMargin: 65.2,
        burn: 1200000,
        runway: 24,
        headcount: 120,
        parsedData: {
          quarter: 'Q3 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did4,
      data: {
        directInvestmentId: di3.id,
        type: 'INVESTOR_UPDATE',
        title: 'DataVault Analytics - Q3 2024 Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/datavault-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'Strong product-market fit. Customer NPS score of 72.',
        lowlights: 'Need to improve sales cycle length.',
        revenue: 2460000, // ARR (2.16M) + non-recurring revenue (300k)
        arr: 2160000,
        mrr: 180000,
        grossMargin: 82.0,
        burn: 280000,
        runway: 12,
        headcount: 18,
        parsedData: {
          quarter: 'Q3 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did5,
      data: {
        directInvestmentId: di4.id,
        type: 'INVESTOR_UPDATE',
        title: 'MediCare AI - Q3 2024 Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/medicare-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'FDA approval received for core product. Partnership with major hospital network.',
        lowlights: 'Regulatory compliance costs higher than expected.',
        revenue: 6740000, // ARR (6.24M) + non-recurring revenue (500k)
        arr: 6240000,
        mrr: 520000,
        grossMargin: 70.5,
        burn: 380000,
        runway: 16,
        headcount: 32,
        parsedData: {
          quarter: 'Q3 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did6,
      data: {
        directInvestmentId: di5.id,
        type: 'INVESTOR_UPDATE',
        title: 'FinTech Pro - Q3 2024 Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/fintech-pro-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'Expanded to 5 new markets. Strong enterprise sales growth.',
        lowlights: 'Competition intensifying in core market.',
        revenue: 26200000, // ARR (25.2M) + non-recurring revenue (1M)
        arr: 25200000,
        mrr: 2100000,
        grossMargin: 75.8,
        burn: 950000,
        runway: 20,
        headcount: 85,
        parsedData: {
          quarter: 'Q3 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did7,
      data: {
        directInvestmentId: di6.id,
        type: 'INVESTOR_UPDATE',
        title: 'CloudSecure Platform - Q3 2024 Update',
        uploadDate: new Date('2024-09-30'),
        url: '/assets/documents/cloudsecure-q3-2024.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-09-30'),
        highlights: 'Strong security certifications achieved. Enterprise customer wins.',
        lowlights: 'Sales cycle longer than expected.',
        revenue: 8100000, // ARR (7.8M) + non-recurring revenue (300k)
        arr: 7800000,
        mrr: 650000,
        grossMargin: 80.2,
        burn: 420000,
        runway: 15,
        headcount: 38,
        parsedData: {
          quarter: 'Q3 2024',
        },
      },
    },
    {
      id: STABLE_IDS.directInvestmentDocuments.did8,
      data: {
        directInvestmentId: di6.id,
        type: 'FINANCIAL_STATEMENT',
        title: 'CloudSecure Platform - Q2 2024 Financial Statement',
        uploadDate: new Date('2024-06-30'),
        url: '/assets/documents/cloudsecure-q2-financial.pdf',
        period: 'Quarter',
        periodDate: new Date('2024-06-30'),
        revenue: 7260000, // ARR (6.96M) + non-recurring revenue (300k)
        arr: 6960000,
        mrr: 580000,
        grossMargin: 79.5,
        headcount: 32,
        parsedData: {
          quarter: 'Q2 2024',
          type: 'financial',
        },
      },
    },
  ]

  for (const { id, data } of directInvestmentDocumentsData) {
    await prisma.directInvestmentDocument.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    })
  }

  console.log(`✅ Upserted ${directInvestmentDocumentsData.length} direct investment documents`)

  // Create sample crypto holdings for demo and beta users
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
      {
        userId: betaUser1.id,
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 8.5,
        valueUsd: 21250,
      },
      {
        userId: betaUser2.id,
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 0.8,
        valueUsd: 52000,
      },
      {
        userId: betaUser3.id,
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 12.0,
        valueUsd: 30000,
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
  console.log(`   Direct Investments: ${Object.values(STABLE_IDS.directInvestments).join(', ')}`)
  console.log(`   Direct Investment Documents: ${Object.values(STABLE_IDS.directInvestmentDocuments).join(', ')}`)
}

// Only run if called directly (not imported)
if (require.main === module) {
  let exitCode = 0
  seed()
    .catch((e) => {
      console.error('❌ Seed failed:', e)
      exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
      process.exit(exitCode)
    })
}

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning database...')
  console.log('Testing database connection...')
  
  try {
    // Test connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Database connected')
  } catch (error) {
    console.error('✗ Database connection failed:', error)
    throw error
  }
  
  // Delete all data in order (respecting foreign key constraints)
  console.log('Deleting activity events...')
  await prisma.activityEvent.deleteMany()
  console.log('Deleting security events...')
  await prisma.securityEvent.deleteMany()
  console.log('Deleting user sessions...')
  await prisma.userSession.deleteMany()
  console.log('Deleting MFA settings...')
  await prisma.mFASettings.deleteMany()
  console.log('Deleting MFA tokens...')
  await prisma.mFAToken.deleteMany()
  console.log('Deleting password resets...')
  await prisma.passwordReset.deleteMany()
  console.log('Deleting audit logs...')
  await prisma.auditLog.deleteMany()
  console.log('Deleting direct investment documents...')
  await prisma.directInvestmentDocument.deleteMany()
  console.log('Deleting direct investments...')
  await prisma.directInvestment.deleteMany()
  console.log('Deleting fund access...')
  await prisma.fundAccess.deleteMany()
  console.log('Deleting distributions...')
  await prisma.distribution.deleteMany().catch(() => console.log('⚠️  Distributions table not yet migrated'))
  console.log('Deleting NAV history...')
  await prisma.navHistory.deleteMany()
  console.log('Deleting documents...')
  await prisma.document.deleteMany()
  console.log('Deleting funds...')
  await prisma.fund.deleteMany()
  console.log('Deleting invitations...')
  await prisma.invitation.deleteMany()
  console.log('Deleting users...')
  await prisma.user.deleteMany()
  console.log('Deleting clients...')
  await prisma.client.deleteMany()

  console.log('✅ Database cleaned')
  console.log('🌱 Seeding database...')

  // Create Clients
  console.log('Creating clients...')
  const client1 = await prisma.client.create({
    data: {
      name: 'Alpine Capital Partners',
      email: 'contact@alpinecapital.eu',
      phone: '+41 44 123 45 67',
      address: 'Bahnhofstrasse 18, 8001 Zürich, Switzerland',
      notes: 'Pan-European institutional investor',
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Baltic Investment Group',
      email: 'info@balticinvest.eu',
      phone: '+46 8 555 12 34',
      address: 'Sveavägen 44, 111 34 Stockholm, Sweden',
    },
  })

  // Create Users
  console.log('Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@onelpm.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  const dataManager = await prisma.user.create({
    data: {
      email: 'datamanager@onelpm.com',
      password: hashedPassword,
      firstName: 'Data',
      lastName: 'Manager',
      name: 'Data Manager',
      role: 'DATA_MANAGER',
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  const lpUser1 = await prisma.user.create({
    data: {
      email: 'lp@acmecapital.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      name: 'John Smith',
      role: 'USER',
      clientId: client1.id,
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      emailWeeklyReports: true,
      emailMonthlyReports: true,
    },
  })

  const lpUser2 = await prisma.user.create({
    data: {
      email: 'lp@globalinvest.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      name: 'Sarah Johnson',
      role: 'USER',
      clientId: client2.id,
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  // Create Funds
  console.log('Creating funds...')
  
  const fund1 = await prisma.fund.create({
    data: {
      name: 'Nordic Innovation Fund III',
      domicile: 'Luxembourg',
      vintage: 2020,
      manager: 'Nordic Innovation Partners S.A.',
      managerEmail: 'ir@nordicinnovation.eu',
      managerPhone: '+352 26 10 55 10',
      managerWebsite: 'www.nordicinnovation.eu',
      commitment: 10000000,
      paidIn: 6500000,
      nav: 8750000,
      irr: 0.24,
      tvpi: 1.65,
      dpi: 0.30,
      lastReportDate: new Date('2024-09-30'),
      clientId: client1.id,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: '- Portfolio company Helios AI (Berlin) raised €45M Series B at €420M valuation\n- Baltic Analytics reached profitability with €11M ARR\n- Completed follow-on in CloudNordic at 2.1x step-up',
      lowlights: '- MedTech Oslo delayed CE Marking by 6 months\n- MobileNord experiencing churn pressures (15% annually)',
      milestones: '- Helios AI launched enterprise product across DACH region\n- Baltic Analytics expanded into the Nordics\n- CloudNordic achieved ISO 27001 certification',
      recentRounds: '- Helios AI: €45M Series B led by Northzone\n- CloudNordic: €20M Series A extension\n- MedTech Oslo: Bridge financing discussions ongoing',
      capTableChanges: '- Increased ownership in Helios AI from 12% to 14%\n- Partial exit from MobileNord (sold 30% to European strategic buyer)',
    },
  })

  const fund2 = await prisma.fund.create({
    data: {
      name: 'Continental Growth Fund 2019',
      domicile: 'Ireland',
      vintage: 2019,
      manager: 'Continental Growth Partners',
      managerEmail: 'ir@continentalgrowth.eu',
      managerPhone: '+353 1 555 0101',
      managerWebsite: 'www.continentalgrowth.eu',
      commitment: 25000000,
      paidIn: 18000000,
      nav: 24500000,
      irr: 0.18,
      tvpi: 1.85,
      dpi: 0.49,
      lastReportDate: new Date('2024-09-30'),
      clientId: client1.id,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: '- FinPay Europe preparing for Euronext listing in 2025\n- HealthConnect platform surpassed 9M EU patients\n- 80% of portfolio exceeding operating plan',
      lowlights: '- LogisticsOne margins compressed (44% → 37%)\n- RetailTech Europe 20% below revenue targets',
      milestones: '- FinPay Europe appointed Deutsche Bank and BNP Paribas as lead banks\n- HealthConnect secured EMA clearance for new module\n- LogisticsOne launched cost-optimisation programme',
    },
  })

  const fund3 = await prisma.fund.create({
    data: {
      name: 'Adriatic Sustainable Infrastructure Fund',
      domicile: 'Luxembourg',
      vintage: 2021,
      manager: 'Adriatic Infrastructure Partners',
      managerEmail: 'contact@adriaticinfra.eu',
      managerWebsite: 'www.adriaticinfra.eu',
      commitment: 15000000,
      paidIn: 5250000,
      nav: 5800000,
      irr: 0.12,
      tvpi: 1.10,
      dpi: 0.05,
      lastReportDate: new Date('2024-06-30'),
      clientId: client2.id,
      period: 'Q2 2024',
      periodDate: new Date('2024-06-30'),
      highlights: '- Central/Eastern Europe renewable assets growing 32% YoY\n- 35% of commitments deployed into EU TEN-T projects',
      lowlights: '- FX headwinds from Croatian kuna shift (-6% impact)\n- Slovenian transport operator facing regulatory delays',
      milestones: '- Closed first investment in Adriatic offshore wind\n- Opened project office in Zagreb',
    },
  })

  const allFunds = [fund1, fund2, fund3]

  // Create NAV History with three years of quarterly data
  console.log('Creating NAV history...')
  const navHistoryEntries: { fundId: string; date: Date; nav: number }[] = []
  for (const fund of allFunds) {
    const latestQuarter = fund.lastReportDate || new Date()
    for (let i = 11; i >= 0; i--) {
      const entryDate = new Date(latestQuarter)
      entryDate.setMonth(entryDate.getMonth() - i * 3)
      const progress = 1 - i / 12
      const baseMultiplier = 0.6 + progress * 0.45
      const noise = 0.9 + Math.random() * 0.2
      const value = i === 0 ? fund.nav : Math.round(fund.nav * Math.min(1.1, baseMultiplier * noise))
      navHistoryEntries.push({ fundId: fund.id, date: entryDate, nav: value })
    }
  }
  await prisma.navHistory.createMany({ data: navHistoryEntries })

  // Generate rolling cash flow history for analytics charts
  console.log('Creating rolling capital call and distribution history...')
  const historyMonths = 18
  const now = new Date()
  const rollingCapitalCallDocs: any[] = []
  const rollingDistributions: any[] = []

  for (const fund of allFunds) {
    const totalPaidIn = fund.paidIn
    const totalDistributionTarget = fund.paidIn * fund.dpi
    let remainingCalls = totalPaidIn
    let remainingDistributions = totalDistributionTarget
    const distributionStart = 4 // wait a few months before distributions start

    for (let monthIndex = 0; monthIndex < historyMonths; monthIndex++) {
      const baseDate = new Date(now.getFullYear(), now.getMonth() - (historyMonths - monthIndex - 1), 1)

      if (remainingCalls > 0) {
        const monthsRemaining = historyMonths - monthIndex
        const baseline = remainingCalls / monthsRemaining
        const amount = monthIndex === historyMonths - 1
          ? Math.round(remainingCalls)
          : Math.max(25000, Math.round(baseline * (0.8 + Math.random() * 0.4)))
        remainingCalls = Math.max(0, remainingCalls - amount)

        rollingCapitalCallDocs.push({
          fundId: fund.id,
          type: 'CAPITAL_CALL',
          title: `${fund.name} - Monthly Capital Call ${monthIndex + 1}`,
          uploadDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 5 + Math.floor(Math.random() * 10)),
          dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 25),
          callAmount: amount,
          paymentStatus:
            monthIndex >= historyMonths - 2
              ? monthIndex === historyMonths - 1
                ? 'PENDING'
                : 'LATE'
              : 'PAID',
          url: '',
          parsedData: {
            schedule: `${baseDate.toLocaleString('default', { month: 'short' })} ${baseDate.getFullYear()}`,
          },
        })
      }

      if (remainingDistributions > 0 && monthIndex >= distributionStart) {
        const monthsRemaining = historyMonths - monthIndex
        const baseline = remainingDistributions / monthsRemaining
        const amount = monthIndex === historyMonths - 1
          ? Math.round(remainingDistributions)
          : Math.max(20000, Math.round(baseline * (0.7 + Math.random() * 0.6)))
        remainingDistributions = Math.max(0, remainingDistributions - amount)

        rollingDistributions.push({
          fundId: fund.id,
          distributionDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 20),
          amount,
          distributionType: 'CASH',
          description: `${fund.name} distribution for ${baseDate.toLocaleString('default', { month: 'short' })} ${baseDate.getFullYear()}`,
          taxYear: baseDate.getFullYear(),
          k1Status: monthIndex >= historyMonths - 2 ? 'PENDING' : 'ISSUED',
        })
      }
    }
  }

  try {
    if (rollingDistributions.length) {
      await prisma.distribution.createMany({ data: rollingDistributions })
    }
  } catch (error) {
    console.log('⚠️  Could not create distributions - table may not exist yet')
  }

  // Create Documents (WITHOUT URLs)
  console.log('Creating documents...')

  // Fund 1 Documents
  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call Notice #1 - Initial Close',
      uploadDate: new Date('2020-03-15'),
      dueDate: new Date('2020-04-15'),
      callAmount: 2500000,
      paymentStatus: 'PAID',
      url: '', // Empty string - no PDF link
      parsedData: {
        callNumber: 1,
        percentage: 25,
        wireInstructions: 'Deutsche Bank Luxembourg, IBAN: LU12 3456 7890 1234',
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call Notice #2',
      uploadDate: new Date('2020-09-10'),
      dueDate: new Date('2020-10-10'),
      callAmount: 2000000,
      paymentStatus: 'PAID',
      url: '',
      parsedData: {
        callNumber: 2,
        percentage: 20,
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call Notice #3',
      uploadDate: new Date('2021-06-15'),
      dueDate: new Date('2021-07-15'),
      callAmount: 1500000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call Notice #4',
      uploadDate: new Date('2024-10-01'),
      dueDate: new Date('2024-11-01'),
      callAmount: 500000,
      paymentStatus: 'PENDING',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'QUARTERLY_REPORT',
      title: 'Q3 2024 Quarterly Report',
      uploadDate: new Date('2024-10-15'),
      url: '',
      parsedData: {
        period: 'Q3 2024',
        portfolioCompanies: 12,
        newInvestments: 1,
        exitedInvestments: 0,
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'QUARTERLY_REPORT',
      title: 'Q2 2024 Quarterly Report',
      uploadDate: new Date('2024-07-20'),
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund1.id,
      type: 'ANNUAL_REPORT',
      title: '2023 Annual Report',
      uploadDate: new Date('2024-03-15'),
      url: '',
      parsedData: {
        year: 2023,
        totalValue: 8200000,
        realizedGains: 450000,
        unrealizedGains: 1250000,
      },
    },
  })

  // Fund 2 Documents
  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #1',
      uploadDate: new Date('2019-06-01'),
      dueDate: new Date('2019-07-01'),
      callAmount: 6000000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #2',
      uploadDate: new Date('2019-12-01'),
      dueDate: new Date('2020-01-01'),
      callAmount: 5000000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #3',
      uploadDate: new Date('2020-09-01'),
      dueDate: new Date('2020-10-01'),
      callAmount: 4500000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #4',
      uploadDate: new Date('2021-06-01'),
      dueDate: new Date('2021-07-01'),
      callAmount: 2500000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'QUARTERLY_REPORT',
      title: 'Q3 2024 Investor Update',
      uploadDate: new Date('2024-10-20'),
      url: '',
      parsedData: {
        portfolioValue: 24500000,
        topPerformer: 'FinTech Solutions',
      },
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund2.id,
      type: 'ANNUAL_REPORT',
      title: '2023 Annual Report & Audited Financials',
      uploadDate: new Date('2024-04-01'),
      url: '',
    },
  })

  // Fund 3 Documents
  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'CAPITAL_CALL',
      title: 'Initial Capital Call',
      uploadDate: new Date('2021-04-01'),
      dueDate: new Date('2021-05-01'),
      callAmount: 3000000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #2',
      uploadDate: new Date('2022-03-15'),
      dueDate: new Date('2022-04-15'),
      callAmount: 2250000,
      paymentStatus: 'PAID',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'CAPITAL_CALL',
      title: 'Capital Call #3 - Urgent Opportunity',
      uploadDate: new Date('2024-11-01'),
      dueDate: new Date('2024-11-20'),
      callAmount: 1500000,
      paymentStatus: 'PENDING',
      url: '',
    },
  })

  await prisma.document.create({
    data: {
      fundId: fund3.id,
      type: 'QUARTERLY_REPORT',
      title: 'Q2 2024 Report',
      uploadDate: new Date('2024-07-30'),
      url: '',
    },
  })

  if (rollingCapitalCallDocs.length) {
    console.log(`Adding ${rollingCapitalCallDocs.length} historical capital call notices for analytics benchmarking...`)
    await prisma.document.createMany({ data: rollingCapitalCallDocs })
  }

  // Create Direct Investments
  console.log('Creating direct investments...')

  const di1 = await prisma.directInvestment.create({
    data: {
      name: 'Helios AI Systems GmbH',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Artificial Intelligence',
      stage: 'Series B',
      investmentDate: new Date('2023-06-15'),
      investmentAmount: 2000000,
      clientId: client1.id,
      revenue: 8500000,
      arr: 10200000,
      mrr: 850000,
      grossMargin: 0.78,
      burn: 600000,
      runway: 24,
      headcount: 85,
      cac: 12000,
      ltv: 48000,
      nrr: 1.25,
      cashBalance: 14500000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: '- Signed 3 DAX 40 customers including Siemens and SAP\n- Launched enterprise AI platform compliant with EU data residency\n- Achieved 200% net euro retention',
      lowlights: '- Sales cycle longer than expected (9 months vs 6 months target)\n- Engineering hiring behind plan across Berlin/Munich hubs',
      milestones: '- Released v2.0 of flagship product\n- Opened offices in Berlin and Copenhagen\n- Achieved ISO 27001 and ENS compliance',
      lastReportDate: new Date('2024-10-15'),
    },
  })

  const di2 = await prisma.directInvestment.create({
    data: {
      name: 'Quantica Analytics AB',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'SaaS',
      stage: 'Series A',
      investmentDate: new Date('2022-03-20'),
      investmentAmount: 1500000,
      clientId: client1.id,
      revenue: 12000000,
      arr: 12000000,
      mrr: 1000000,
      grossMargin: 0.85,
      burn: 0, // Profitable
      runway: 999,
      headcount: 62,
      nrr: 1.15,
      cashBalance: 8200000,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: '- Achieved profitability for the first time\n- Expanded to 15 European countries\n- Customer count exceeded 500',
      lowlights: '- Churn increased from 5% to 8% annually',
      milestones: '- Crossed €1M MRR milestone\n- Launched mobile app supporting EU languages\n- Established headquarters in Stockholm with EMEA sales team',
      lastReportDate: new Date('2024-10-10'),
    },
  })

  const di3 = await prisma.directInvestment.create({
    data: {
      name: 'Europa Office Park',
      investmentType: 'REAL_ESTATE',
      industry: 'Real Estate',
      propertyType: 'Commercial Office',
      propertyAddress: 'Alexanderplatz 5, 10178 Berlin, Germany',
      squareFootage: 125000,
      purchaseDate: new Date('2021-08-01'),
      purchaseValue: 32000000,
      currentAppraisal: 40500000,
      rentalIncome: 3200000,
      occupancyRate: 0.92,
      propertyTax: 390000,
      maintenanceCost: 420000,
      netOperatingIncome: 2600000,
      investmentDate: new Date('2021-08-01'),
      investmentAmount: 10000000,
      clientId: client2.id,
      period: 'Q3 2024',
      periodDate: new Date('2024-09-30'),
      highlights: '- Signed 7-year lease with German fintech tenant for 4,200 sqm\n- Property valuation increased 18% YoY\n- Occupancy rate at 92%',
      lowlights: '- One tenant (800 sqm) gave notice for Q1 2025\n- Capital expenditure needed for HVAC upgrade',
      lastReportDate: new Date('2024-10-01'),
    },
  })

  const di4 = await prisma.directInvestment.create({
    data: {
      name: 'EuroBank Senior Debt Facility',
      investmentType: 'PRIVATE_DEBT',
      industry: 'FinTech',
      principalAmount: 5000000,
      interestRate: 0.092,
      maturityDate: new Date('2026-12-31'),
      creditRating: 'BBB',
      defaultStatus: 'CURRENT',
      currentValue: 5080000,
      yield: 0.096,
      investmentDate: new Date('2023-01-15'),
      investmentAmount: 5000000,
      clientId: client2.id,
      lastReportDate: new Date('2024-09-30'),
    },
  })

  // Create Direct Investment Documents (WITHOUT URLs)
  console.log('Creating direct investment documents...')

  await prisma.directInvestmentDocument.create({
    data: {
      directInvestmentId: di1.id,
      type: 'EXECUTIVE_SUMMARY',
      title: 'Q3 2024 Executive Summary',
      uploadDate: new Date('2024-10-15'),
      url: '',
      period: 'Quarter',
      periodDate: new Date('2024-09-30'),
      highlights: '- Signed 3 Fortune 500 customers\n- Launched enterprise AI platform\n- 200% NRR',
      lowlights: '- Sales cycle longer than expected\n- Engineering hiring behind plan',
      milestones: '- Released v2.0\n- Opened European office\n- SOC 2 compliance',
      revenue: 8500000,
      arr: 10200000,
      mrr: 850000,
      grossMargin: 0.78,
      burn: 600000,
      runway: 24,
      headcount: 85,
      cac: 12000,
      ltv: 48000,
      nrr: 1.25,
      cashBalance: 14500000,
    },
  })

  await prisma.directInvestmentDocument.create({
    data: {
      directInvestmentId: di1.id,
      type: 'EXECUTIVE_SUMMARY',
      title: 'Q2 2024 Executive Summary',
      uploadDate: new Date('2024-07-20'),
      url: '',
      period: 'Quarter',
      periodDate: new Date('2024-06-30'),
      revenue: 7200000,
      arr: 8600000,
      mrr: 716000,
      grossMargin: 0.76,
      burn: 650000,
      runway: 22,
      headcount: 78,
      cashBalance: 14300000,
    },
  })

  await prisma.directInvestmentDocument.create({
    data: {
      directInvestmentId: di1.id,
      type: 'EXECUTIVE_SUMMARY',
      title: 'Q1 2024 Executive Summary',
      uploadDate: new Date('2024-04-15'),
      url: '',
      period: 'Quarter',
      periodDate: new Date('2024-03-31'),
      revenue: 6100000,
      arr: 7300000,
      mrr: 608000,
      grossMargin: 0.75,
      burn: 700000,
      runway: 21,
      headcount: 72,
      cashBalance: 14700000,
    },
  })

  await prisma.directInvestmentDocument.create({
    data: {
      directInvestmentId: di2.id,
      type: 'FINANCIAL_STATEMENT',
      title: 'Q3 2024 Financial Statement',
      uploadDate: new Date('2024-10-10'),
      url: '',
      period: 'Quarter',
      periodDate: new Date('2024-09-30'),
      revenue: 12000000,
      arr: 12000000,
      mrr: 1000000,
      grossMargin: 0.85,
      burn: 0,
      runway: 999,
      headcount: 62,
      nrr: 1.15,
      cashBalance: 8200000,
    },
  })

  await prisma.directInvestmentDocument.create({
    data: {
      directInvestmentId: di3.id,
      type: 'INVESTOR_UPDATE',
      title: 'Q3 2024 Property Update',
      uploadDate: new Date('2024-10-01'),
      url: '',
      period: 'Quarter',
      periodDate: new Date('2024-09-30'),
      currentAppraisal: 42000000,
      rentalIncome: 3500000,
      occupancyRate: 0.92,
      netOperatingIncome: 2670000,
    },
  })

  // Create Fund Access
  console.log('Creating fund access...')

  await prisma.fundAccess.create({
    data: {
      userId: lpUser1.id,
      fundId: fund1.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_ONLY',
    },
  })

  await prisma.fundAccess.create({
    data: {
      userId: lpUser1.id,
      fundId: fund2.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_ONLY',
    },
  })

  await prisma.fundAccess.create({
    data: {
      userId: lpUser2.id,
      fundId: fund3.id,
      relationshipType: 'LP',
      permissionLevel: 'READ_ONLY',
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 2 Clients`)
  console.log(`   - 4 Users (1 Admin, 1 Data Manager, 2 LPs)`)
  console.log(`   - 3 Funds`)
  console.log(`   - 12 NAV History entries`)
  console.log(`   - 6 Distributions`)
  console.log(`   - 16 Fund Documents`)
  console.log(`   - 4 Direct Investments`)
  console.log(`   - 5 Direct Investment Documents`)
  console.log(`   - 3 Fund Access grants`)
  console.log('\n🔐 Login Credentials:')
  console.log('   Admin: admin@onelpm.com / password123')
  console.log('   Data Manager: datamanager@onelpm.com / password123')
  console.log('   LP 1: lp@acmecapital.com / password123')
  console.log('   LP 2: lp@globalinvest.com / password123')
  console.log('\n📝 Note: All documents created WITHOUT PDF links (url field empty)')
}

// Add timeout to prevent infinite hanging
const timeout = setTimeout(() => {
  console.error('\n❌ Seed script timed out after 60 seconds')
  console.error('This usually means:')
  console.error('  1. Database connection issue (check DATABASE_URL in .env)')
  console.error('  2. Database is not accessible')
  console.error('  3. Migrations not run (try: npx prisma migrate dev)')
  process.exit(1)
}, 60000) // 60 second timeout

main()
  .then(() => {
    clearTimeout(timeout)
  })
  .catch((e) => {
    clearTimeout(timeout)
    console.error('\n❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('\nDisconnecting from database...')
    await prisma.$disconnect()
    console.log('Disconnected.')
  })

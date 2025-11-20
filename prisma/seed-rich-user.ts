import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating rich demo user with extensive portfolio...')

  // Create or find the client
  const client = await prisma.client.upsert({
    where: { id: 'demo-client-rich' },
    update: {},
    create: {
      id: 'demo-client-rich',
      name: 'Institutional Investors LP',
      email: 'invest@institutional-lp.com',
      phone: '+1-415-555-9876',
      address: '555 Market Street, Suite 3000, San Francisco, CA 94105, USA',
      notes: 'Family office with $300M+ AUM focused on PE/VC investments',
    },
  })

  console.log('✅ Client created:', client.name)

  // Create the rich demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@institutional-lp.com' },
    update: {},
    create: {
      email: 'demo@institutional-lp.com',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      name: 'Michael Chen',
      role: 'USER',
      clientId: client.id,
      emailWeeklyReports: true,
      emailMonthlyReports: true,
    },
  })

  console.log('✅ User created:', user.email)

  // Create 12 diverse funds with realistic data
  console.log('📊 Creating 12 funds with complete data...')

  const funds = []

  // Fund 1: Sequoia Capital XII (Top performing VC fund)
  const fund1 = await prisma.fund.create({
    data: {
      name: 'Sequoia Capital XII',
      manager: 'Sequoia Capital',
      managerEmail: 'ir@sequoiacap.com',
      managerPhone: '+1-650-854-3927',
      managerWebsite: 'https://www.sequoiacap.com',
      vintage: 2018,
      domicile: 'United States',
      commitment: 50000000,
      paidIn: 42000000,
      nav: 95000000,
      irr: 0.38,
      tvpi: 2.62,
      dpi: 0.36,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund1)

  // Fund 2: Andreessen Horowitz Fund VI (Tech-focused VC)
  const fund2 = await prisma.fund.create({
    data: {
      name: 'Andreessen Horowitz Fund VI',
      manager: 'Andreessen Horowitz',
      managerEmail: 'lp@a16z.com',
      managerPhone: '+1-650-687-3130',
      managerWebsite: 'https://a16z.com',
      vintage: 2019,
      domicile: 'United States',
      commitment: 35000000,
      paidIn: 28000000,
      nav: 52000000,
      irr: 0.32,
      tvpi: 2.14,
      dpi: 0.28,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund2)

  // Fund 3: Accel Growth Fund IV (Growth equity)
  const fund3 = await prisma.fund.create({
    data: {
      name: 'Accel Growth Fund IV',
      manager: 'Accel Partners',
      managerEmail: 'operations@accel.com',
      managerPhone: '+1-650-614-4800',
      managerWebsite: 'https://www.accel.com',
      vintage: 2020,
      domicile: 'United States',
      commitment: 40000000,
      paidIn: 32000000,
      nav: 48000000,
      irr: 0.24,
      tvpi: 1.75,
      dpi: 0.25,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund3)

  // Fund 4: KKR European Fund V (Large buyout - Europe)
  const fund4 = await prisma.fund.create({
    data: {
      name: 'KKR European Fund V',
      manager: 'Kohlberg Kravis Roberts',
      managerEmail: 'ir@kkr.com',
      managerPhone: '+44-20-7839-2200',
      managerWebsite: 'https://www.kkr.com',
      vintage: 2017,
      domicile: 'United Kingdom',
      commitment: 75000000,
      paidIn: 68000000,
      nav: 82000000,
      irr: 0.18,
      tvpi: 1.65,
      dpi: 0.45,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund4)

  // Fund 5: Blackstone Strategic Partners VIII (Secondaries)
  const fund5 = await prisma.fund.create({
    data: {
      name: 'Blackstone Strategic Partners VIII',
      manager: 'Blackstone Group',
      managerEmail: 'bxir@blackstone.com',
      managerPhone: '+1-212-583-5000',
      managerWebsite: 'https://www.blackstone.com',
      vintage: 2019,
      domicile: 'United States',
      commitment: 60000000,
      paidIn: 55000000,
      nav: 68000000,
      irr: 0.16,
      tvpi: 1.52,
      dpi: 0.29,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund5)

  // Fund 6: Index Ventures VII (Early-stage VC)
  const fund6 = await prisma.fund.create({
    data: {
      name: 'Index Ventures VII',
      manager: 'Index Ventures',
      managerEmail: 'team@indexventures.com',
      managerPhone: '+44-20-7938-3500',
      managerWebsite: 'https://www.indexventures.com',
      vintage: 2021,
      domicile: 'Switzerland',
      commitment: 30000000,
      paidIn: 18000000,
      nav: 21500000,
      irr: 0.22,
      tvpi: 1.28,
      dpi: 0.09,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund6)

  // Fund 7: TPG Growth IV (Growth equity)
  const fund7 = await prisma.fund.create({
    data: {
      name: 'TPG Growth IV',
      manager: 'TPG Capital',
      managerEmail: 'ir@tpg.com',
      managerPhone: '+1-415-743-1500',
      managerWebsite: 'https://www.tpg.com',
      vintage: 2020,
      domicile: 'United States',
      commitment: 45000000,
      paidIn: 38000000,
      nav: 52000000,
      irr: 0.21,
      tvpi: 1.58,
      dpi: 0.21,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund7)

  // Fund 8: Warburg Pincus Private Equity XIII (Global)
  const fund8 = await prisma.fund.create({
    data: {
      name: 'Warburg Pincus Private Equity XIII',
      manager: 'Warburg Pincus',
      managerEmail: 'info@warburgpincus.com',
      managerPhone: '+1-212-878-0600',
      managerWebsite: 'https://www.warburgpincus.com',
      vintage: 2018,
      domicile: 'United States',
      commitment: 55000000,
      paidIn: 48000000,
      nav: 62000000,
      irr: 0.19,
      tvpi: 1.79,
      dpi: 0.50,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund8)

  // Fund 9: General Catalyst Fund XII (Multi-stage)
  const fund9 = await prisma.fund.create({
    data: {
      name: 'General Catalyst Fund XII',
      manager: 'General Catalyst',
      managerEmail: 'team@generalcatalyst.com',
      managerPhone: '+1-617-234-7000',
      managerWebsite: 'https://www.generalcatalyst.com',
      vintage: 2021,
      domicile: 'United States',
      commitment: 38000000,
      paidIn: 22000000,
      nav: 26000000,
      irr: 0.20,
      tvpi: 1.32,
      dpi: 0.14,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund9)

  // Fund 10: Lightspeed Venture Partners XIV (Early-stage)
  const fund10 = await prisma.fund.create({
    data: {
      name: 'Lightspeed Venture Partners XIV',
      manager: 'Lightspeed Venture Partners',
      managerEmail: 'contact@lsvp.com',
      managerPhone: '+1-650-234-8300',
      managerWebsite: 'https://lsvp.com',
      vintage: 2022,
      domicile: 'United States',
      commitment: 28000000,
      paidIn: 14000000,
      nav: 15800000,
      irr: 0.18,
      tvpi: 1.18,
      dpi: 0.05,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund10)

  // Fund 11: Insight Partners Fund XII (Growth/Buyout)
  const fund11 = await prisma.fund.create({
    data: {
      name: 'Insight Partners Fund XII',
      manager: 'Insight Partners',
      managerEmail: 'info@insightpartners.com',
      managerPhone: '+1-212-230-9200',
      managerWebsite: 'https://www.insightpartners.com',
      vintage: 2019,
      domicile: 'United States',
      commitment: 42000000,
      paidIn: 36000000,
      nav: 48000000,
      irr: 0.20,
      tvpi: 1.67,
      dpi: 0.33,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund11)

  // Fund 12: Bessemer Venture Partners XI (Multi-stage)
  const fund12 = await prisma.fund.create({
    data: {
      name: 'Bessemer Venture Partners XI',
      manager: 'Bessemer Venture Partners',
      managerEmail: 'ir@bvp.com',
      managerPhone: '+1-650-687-5500',
      managerWebsite: 'https://www.bvp.com',
      vintage: 2020,
      domicile: 'United States',
      commitment: 32000000,
      paidIn: 26000000,
      nav: 34000000,
      irr: 0.19,
      tvpi: 1.54,
      dpi: 0.23,
      lastReportDate: new Date('2024-12-31'),
      clientId: client.id,
    },
  })
  funds.push(fund12)

  console.log(`✅ Created ${funds.length} funds`)

  // Create NAV history for all funds (quarterly data for 3 years)
  console.log('📈 Creating NAV history...')
  let navHistoryCount = 0

  for (const fund of funds) {
    const startDate = new Date(fund.vintage, 0, 1)
    const quarters = []
    
    // Generate 12 quarters of NAV history
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i * 3)
      
      // Simulate NAV growth with some volatility
      const growthFactor = 1 + (fund.tvpi - 1) * (i / 12) + (Math.random() - 0.5) * 0.1
      const nav = fund.paidIn * Math.max(0.8, Math.min(1.2, growthFactor))
      
      quarters.push({
        fundId: fund.id,
        date: date,
        nav: Math.round(nav),
      })
    }

    await prisma.navHistory.createMany({
      data: quarters,
    })
    navHistoryCount += quarters.length
  }

  console.log(`✅ Created ${navHistoryCount} NAV history entries`)

  // Create distributions for mature funds
  console.log('💰 Creating distributions...')
  const distributionData = []

  for (const fund of funds) {
    if (fund.dpi > 0.2) {
      // Create 2-4 distributions per mature fund
      const numDistributions = Math.floor(2 + Math.random() * 3)
      
      for (let i = 0; i < numDistributions; i++) {
        const distribDate = new Date(fund.vintage + 2 + i, 3 * i, 15)
        const amount = (fund.dpi * fund.paidIn) / numDistributions * (0.8 + Math.random() * 0.4)
        
        distributionData.push({
          fundId: fund.id,
          distributionDate: distribDate,
          amount: Math.round(amount),
          distributionType: 'CASH',
        })
      }
    }
  }

  await prisma.distribution.createMany({
    data: distributionData,
  })

  console.log(`✅ Created ${distributionData.length} distributions`)

  // Create comprehensive fund documents
  console.log('📄 Creating fund documents...')
  const fundDocuments: any[] = []

  for (const fund of funds) {
    // Quarterly reports (last 4 quarters)
    for (let q = 0; q < 4; q++) {
      const reportDate = new Date(2024, 9 - q * 3, 30) // Q4, Q3, Q2, Q1
      fundDocuments.push({
        fundId: fund.id,
        type: 'QUARTERLY_REPORT' as const,
        title: `${fund.name} - Q${4 - q} 2024 Quarterly Report`,
        uploadDate: reportDate,
        url: '', // No PDF as requested
        parsedData: {},
      })
    }

    // Annual reports (last 2 years)
    for (let y = 0; y < 2; y++) {
      const reportDate = new Date(2023 + y, 11, 31)
      fundDocuments.push({
        fundId: fund.id,
        type: 'ANNUAL_REPORT' as const,
        title: `${fund.name} - ${2023 + y} Annual Report`,
        uploadDate: reportDate,
        url: '',
        parsedData: {},
      })
    }

    // K-1 tax documents
    fundDocuments.push({
      fundId: fund.id,
      type: 'COMPLIANCE' as const,
      title: `${fund.name} - 2023 K-1 Tax Document`,
      uploadDate: new Date(2024, 2, 15),
      url: '',
      parsedData: {},
    })

    // Capital calls (2-3 per fund for younger funds)
    if (fund.paidIn < fund.commitment) {
      const numCalls = Math.floor(2 + Math.random() * 2)
      for (let c = 0; c < numCalls; c++) {
        const callDate = new Date(2024, c * 3, 15)
        const dueDate = new Date(callDate)
        dueDate.setDate(dueDate.getDate() + 30)
        
        fundDocuments.push({
          fundId: fund.id,
          type: 'CAPITAL_CALL' as const,
          title: `${fund.name} - Capital Call Notice ${c + 1}`,
          uploadDate: callDate,
          dueDate: dueDate,
          callAmount: (fund.commitment - fund.paidIn) / numCalls,
          paymentStatus: c === 0 ? 'PENDING' : 'PAID',
          url: '',
          parsedData: {},
        })
      }
    }

    // Distribution notices
    if (fund.dpi > 0.2) {
      fundDocuments.push({
        fundId: fund.id,
        type: 'OTHER' as const,
        title: `${fund.name} - Distribution Notice Q3 2024`,
        uploadDate: new Date(2024, 8, 30),
        url: '',
        parsedData: {},
      })
    }

    // Partnership agreements and side letters
    fundDocuments.push({
      fundId: fund.id,
      type: 'OTHER' as const,
      title: `${fund.name} - Limited Partnership Agreement`,
      uploadDate: new Date(fund.vintage, 0, 15),
      url: '',
      parsedData: {},
    })

    fundDocuments.push({
      fundId: fund.id,
      type: 'OTHER' as const,
      title: `${fund.name} - Side Letter Agreement`,
      uploadDate: new Date(fund.vintage, 0, 15),
      url: '',
      parsedData: {},
    })
  }

  await prisma.document.createMany({
    data: fundDocuments,
  })

  console.log(`✅ Created ${fundDocuments.length} fund documents`)

  // Create 15 diverse direct investments
  console.log('🏢 Creating direct investments...')

  const directInvestments = []

  // DI 1: SaaS Company - Series C
  const di1 = await prisma.directInvestment.create({
    data: {
      name: 'CloudScale Technologies',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Enterprise SaaS',
      stage: 'Series C',
      investmentDate: new Date('2022-03-15'),
      investmentAmount: 5000000,
      currentValue: 8500000,
      clientId: client.id,
      revenue: 18000000,
      arr: 22000000,
      mrr: 1833000,
      grossMargin: 0.82,
      burn: 800000,
      runway: 32,
      headcount: 125,
      cac: 15000,
      ltv: 75000,
      nrr: 1.35,
      cashBalance: 25600000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Signed 12 Fortune 500 customers including Amazon and Microsoft\n- Launched AI-powered analytics platform\n- Achieved 135% net dollar retention\n- Expanded to EMEA with 3 new offices',
      lowlights: '- Sales cycle extended to 7 months vs 5 month target\n- Engineering hiring behind plan by 15 positions\n- Customer churn increased to 8% (from 5%)',
      milestones: '- Released CloudScale v3.0 with AI capabilities\n- Achieved SOC 2 Type II and ISO 27001 certifications\n- Opened London, Paris, and Berlin offices\n- Reached $20M ARR milestone',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di1)

  // DI 2: FinTech - Series B
  const di2 = await prisma.directInvestment.create({
    data: {
      name: 'PayFlow Systems',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'FinTech',
      stage: 'Series B',
      investmentDate: new Date('2023-06-20'),
      investmentAmount: 3500000,
      currentValue: 4900000,
      clientId: client.id,
      revenue: 8500000,
      arr: 10200000,
      mrr: 850000,
      grossMargin: 0.75,
      burn: 600000,
      runway: 28,
      headcount: 82,
      cac: 8000,
      ltv: 42000,
      nrr: 1.28,
      cashBalance: 16800000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Processed $1.2B in payment volume (up 180% YoY)\n- Launched embedded finance API\n- Partnered with Visa and Mastercard\n- Achieved profitability milestone',
      lowlights: '- Regulatory approval delayed in EU market\n- Competition intensified from incumbent banks\n- Lost 2 key engineering leads',
      milestones: '- Obtained money transmitter licenses in 48 states\n- Reached 10,000 business customers\n- Launched real-time payment rails\n- Achieved PCI DSS Level 1 certification',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di2)

  // DI 3: Healthcare IT - Series D
  const di3 = await prisma.directInvestment.create({
    data: {
      name: 'MediConnect Health',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Healthcare Technology',
      stage: 'Series D',
      investmentDate: new Date('2021-09-10'),
      investmentAmount: 8000000,
      currentValue: 15200000,
      clientId: client.id,
      revenue: 45000000,
      arr: 52000000,
      mrr: 4333000,
      grossMargin: 0.78,
      burn: 1200000,
      runway: 40,
      headcount: 285,
      cac: 25000,
      ltv: 180000,
      nrr: 1.42,
      cashBalance: 48000000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Connected to 2,500 hospitals across North America\n- Launched AI-powered clinical decision support\n- Achieved HITRUST certification\n- Expanded into telehealth services',
      lowlights: '- HIPAA compliance investigation (since resolved)\n- Integration delays with Epic and Cerner\n- Higher than expected cloud infrastructure costs',
      milestones: '- Processed 50M patient records\n- Launched interoperability platform\n- Acquired competitor SmartHealth for $12M\n- Signed partnership with Mayo Clinic',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di3)

  // DI 4: AI/ML Startup - Series A
  const di4 = await prisma.directInvestment.create({
    data: {
      name: 'NeuralEdge AI',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Artificial Intelligence',
      stage: 'Series A',
      investmentDate: new Date('2023-11-01'),
      investmentAmount: 2500000,
      currentValue: 3200000,
      clientId: client.id,
      revenue: 1800000,
      arr: 2400000,
      mrr: 200000,
      grossMargin: 0.85,
      burn: 450000,
      runway: 22,
      headcount: 35,
      cac: 12000,
      ltv: 55000,
      nrr: 1.15,
      cashBalance: 9900000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Signed first 3 enterprise customers (Google, Meta, Salesforce)\n- Launched GPT-4 powered platform\n- Published 2 papers at NeurIPS\n- Hired former OpenAI research lead',
      lowlights: '- Longer sales cycles than expected (9 months)\n- GPU compute costs higher than budgeted\n- Lost key ML engineer to competitor',
      milestones: '- Processed 100M AI inference requests\n- Achieved 99.9% uptime SLA\n- Launched model marketplace\n- Raised additional $5M strategic round',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di4)

  // DI 5: E-commerce Platform - Series C
  const di5 = await prisma.directInvestment.create({
    data: {
      name: 'ShopDirect Commerce',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'E-commerce',
      stage: 'Series C',
      investmentDate: new Date('2022-07-15'),
      investmentAmount: 6000000,
      currentValue: 9600000,
      clientId: client.id,
      revenue: 32000000,
      arr: 38000000,
      mrr: 3167000,
      grossMargin: 0.68,
      burn: 900000,
      runway: 30,
      headcount: 165,
      cac: 18000,
      ltv: 95000,
      nrr: 1.25,
      cashBalance: 27000000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- GMV reached $250M (up 85% YoY)\n- Expanded to 15 new countries\n- Launched B2B marketplace\n- Achieved unit economics profitability',
      lowlights: '- Fraud losses higher than expected at 0.8% of GMV\n- Warehouse automation delays\n- Customer acquisition costs increased 25%',
      milestones: '- Onboarded 50,000 sellers\n- Processed 2M orders per month\n- Launched same-day delivery in 10 cities\n- Integrated with Shopify and WooCommerce',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di5)

  // DI 6: Cybersecurity - Series B
  const di6 = await prisma.directInvestment.create({
    data: {
      name: 'SecureNet Defense',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Cybersecurity',
      stage: 'Series B',
      investmentDate: new Date('2023-02-20'),
      investmentAmount: 4000000,
      currentValue: 5800000,
      clientId: client.id,
      revenue: 12000000,
      arr: 15000000,
      mrr: 1250000,
      grossMargin: 0.80,
      burn: 700000,
      runway: 26,
      headcount: 95,
      cac: 20000,
      ltv: 110000,
      nrr: 1.38,
      cashBalance: 18200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Detected and prevented 10,000+ cyber attacks\n- Achieved FedRAMP authorization\n- Expanded SOC to 24/7 operations\n- Signed 5 Fortune 500 customers',
      lowlights: '- False positive rate higher than target (5% vs 2%)\n- Competition from CrowdStrike and SentinelOne\n- Security analyst retention at 75%',
      milestones: '- Raised $20M Series B led by Sequoia\n- Launched AI-powered threat detection\n- Achieved ISO 27001 and SOC 2 Type II\n- Expanded to EMEA market',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di6)

  // DI 7: Private Debt - Corporate Bond
  const di7 = await prisma.directInvestment.create({
    data: {
      name: 'TechCorp Senior Notes 2028',
      investmentType: 'PRIVATE_DEBT',
      industry: 'Technology',
      investmentDate: new Date('2023-05-15'),
      investmentAmount: 10000000,
      currentValue: 10350000,
      clientId: client.id,
      principalAmount: 10000000,
      interestRate: 0.078,
      couponRate: 0.078,
      maturityDate: new Date('2028-05-15'),
      creditRating: 'BBB+',
      defaultStatus: 'CURRENT',
      yield: 0.074,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di7)

  // DI 8: Real Estate - Office Building
  const di8 = await prisma.directInvestment.create({
    data: {
      name: 'San Francisco Tech Campus',
      investmentType: 'REAL_ESTATE',
      industry: 'Commercial Real Estate',
      investmentDate: new Date('2021-08-20'),
      investmentAmount: 25000000,
      currentValue: 27500000,
      clientId: client.id,
      propertyType: 'Commercial Office',
      propertyAddress: '123 Market Street, San Francisco, CA 94103',
      squareFootage: 185000,
      purchaseDate: new Date('2021-08-20'),
      purchaseValue: 25000000,
      currentAppraisal: 27500000,
      rentalIncome: 2400000,
      occupancyRate: 0.82,
      propertyTax: 312000,
      maintenanceCost: 480000,
      netOperatingIncome: 1608000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di8)

  // DI 9: Public Equity - Tech Stock
  const di9 = await prisma.directInvestment.create({
    data: {
      name: 'NVIDIA Corporation',
      investmentType: 'PUBLIC_EQUITY',
      industry: 'Semiconductors',
      investmentDate: new Date('2023-01-15'),
      investmentAmount: 3000000,
      currentValue: 7200000,
      clientId: client.id,
      tickerSymbol: 'NVDA',
      shares: 12500,
      purchasePrice: 240,
      currentPrice: 576,
      dividends: 18750,
      marketValue: 7200000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di9)

  // DI 10: DevOps/Infrastructure - Series B
  const di10 = await prisma.directInvestment.create({
    data: {
      name: 'KubeFlow Systems',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Developer Tools',
      stage: 'Series B',
      investmentDate: new Date('2023-04-10'),
      investmentAmount: 3800000,
      currentValue: 5300000,
      clientId: client.id,
      revenue: 9200000,
      arr: 11500000,
      mrr: 958000,
      grossMargin: 0.88,
      burn: 520000,
      runway: 30,
      headcount: 68,
      cac: 9500,
      ltv: 62000,
      nrr: 1.32,
      cashBalance: 15600000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Reached 5,000 enterprise customers\n- Launched managed Kubernetes service\n- Integrated with all major cloud providers\n- 98% customer satisfaction score',
      lowlights: '- Competition from HashiCorp intensified\n- Open source community engagement declined\n- Pricing pressure from cloud providers',
      milestones: '- Processed 100M container deployments\n- Achieved SOC 2 Type II certification\n- Launched enterprise support tier\n- Expanded to Asia-Pacific region',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di10)

  // DI 11: Climate Tech - Series C
  const di11 = await prisma.directInvestment.create({
    data: {
      name: 'GreenTech Carbon Solutions',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Climate Technology',
      stage: 'Series C',
      investmentDate: new Date('2022-05-15'),
      investmentAmount: 7500000,
      currentValue: 11200000,
      clientId: client.id,
      revenue: 28000000,
      arr: 35000000,
      mrr: 2917000,
      grossMargin: 0.72,
      burn: 1100000,
      runway: 28,
      headcount: 145,
      cac: 22000,
      ltv: 145000,
      nrr: 1.35,
      cashBalance: 30800000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Offset 2.5M tons of CO2 equivalent\n- Signed contracts with 150 Fortune 1000 companies\n- Launched carbon credit marketplace\n- Received B Corp certification',
      lowlights: '- Regulatory uncertainty in carbon markets\n- Competition from Stripe Climate\n- Project development slower than expected',
      milestones: '- Raised $50M Series C led by Breakthrough Energy\n- Expanded to 15 countries\n- Launched reforestation program in Brazil\n- Achieved carbon negative operations',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di11)

  // DI 12: EdTech - Series B
  const di12 = await prisma.directInvestment.create({
    data: {
      name: 'LearnSmart Platform',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Education Technology',
      stage: 'Series B',
      investmentDate: new Date('2023-09-01'),
      investmentAmount: 4200000,
      currentValue: 5600000,
      clientId: client.id,
      revenue: 11500000,
      arr: 14000000,
      mrr: 1167000,
      grossMargin: 0.76,
      burn: 650000,
      runway: 24,
      headcount: 88,
      cac: 450,
      ltv: 3200,
      nrr: 1.18,
      cashBalance: 15600000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Reached 2.5M active learners\n- Partnered with 1,200 schools and universities\n- Launched AI tutoring assistant\n- Achieved 95% course completion rate',
      lowlights: '- Slower B2C adoption than expected\n- Competition from Coursera and Udacity\n- Content creation costs higher than budgeted',
      milestones: '- Launched 500 new courses\n- Expanded to Latin America and Asia\n- Achieved COPPA and FERPA compliance\n- Integrated with Canvas and Blackboard',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di12)

  // DI 13: Logistics Tech - Series C
  const di13 = await prisma.directInvestment.create({
    data: {
      name: 'FreightOptimize AI',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Supply Chain & Logistics',
      stage: 'Series C',
      investmentDate: new Date('2022-11-20'),
      investmentAmount: 6800000,
      currentValue: 10200000,
      clientId: client.id,
      revenue: 24000000,
      arr: 29000000,
      mrr: 2417000,
      grossMargin: 0.70,
      burn: 850000,
      runway: 32,
      headcount: 132,
      cac: 28000,
      ltv: 165000,
      nrr: 1.28,
      cashBalance: 27200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Optimized $1.8B in freight spend\n- AI reduced shipping costs by avg 18%\n- Signed 8 of top 10 retailers\n- Expanded to ocean and air freight',
      lowlights: '- Supply chain disruptions impacted adoption\n- Integration complexity with legacy TMS systems\n- Competition from incumbents like Oracle',
      milestones: '- Processed 500K shipments per month\n- Launched predictive ETscript analytics\n- Achieved 99.5% on-time delivery\n- Expanded to Europe and Asia',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di13)

  // DI 14: Biotech - Series A
  const di14 = await prisma.directInvestment.create({
    data: {
      name: 'GenomeCure Therapeutics',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Biotechnology',
      stage: 'Series A',
      investmentDate: new Date('2023-08-15'),
      investmentAmount: 5500000,
      currentValue: 6800000,
      clientId: client.id,
      revenue: 850000,
      burn: 950000,
      runway: 18,
      headcount: 42,
      cashBalance: 17100000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Completed Phase 1 clinical trials successfully\n- FDA granted Fast Track designation\n- Published positive data in Nature Medicine\n- Partnered with Roche for distribution',
      lowlights: '- Phase 2 trials delayed by 6 months\n- Patient recruitment slower than expected\n- Manufacturing scale-up challenges',
      milestones: '- Initiated Phase 2 trials in oncology\n- Received $3M NIH grant\n- Hired former Genentech CMO\n- Filed 3 new patent applications',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di14)

  // DI 15: Consumer Tech - Series B
  const di15 = await prisma.directInvestment.create({
    data: {
      name: 'WearableHealth Devices',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Consumer Electronics',
      stage: 'Series B',
      investmentDate: new Date('2023-03-01'),
      investmentAmount: 4500000,
      currentValue: 6300000,
      clientId: client.id,
      revenue: 16500000,
      arr: 8200000,
      mrr: 683000,
      grossMargin: 0.58,
      burn: 720000,
      runway: 26,
      headcount: 98,
      cac: 85,
      ltv: 420,
      nrr: 1.22,
      cashBalance: 18720000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Sold 250K devices (up 180% YoY)\n- Launched in Apple Store and Best Buy\n- FDA clearance for blood pressure monitoring\n- Partnership with UnitedHealthcare',
      lowlights: '- Supply chain issues with chip shortage\n- Competition from Apple Watch intensified\n- Customer retention at 65% (below 75% target)',
      milestones: '- Reached 500K active users\n- Launched premium subscription service ($9.99/mo)\n- Expanded to 12 new countries\n- Achieved CE Mark certification for EU',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di15)

  console.log(`✅ Created ${directInvestments.length} direct investments`)

  // Create documents for each direct investment
  console.log('📄 Creating direct investment documents...')
  const diDocuments: any[] = []

  for (const di of directInvestments) {
    if (di.investmentType === 'PRIVATE_EQUITY') {
      // Quarterly investor updates (last 4 quarters)
      for (let q = 0; q < 4; q++) {
        const reportDate = new Date(2024, 9 - q * 3, 30)
        diDocuments.push({
          directInvestmentId: di.id,
          type: 'INVESTOR_UPDATE' as const,
          title: `${di.name} - Q${4 - q} 2024 Investor Update`,
          uploadDate: reportDate,
          url: '',
          parsedData: {},
          period: `Q${4 - q} 2024`,
          periodDate: reportDate,
          highlights: di.highlights,
          lowlights: di.lowlights,
          milestones: di.milestones,
          revenue: di.revenue,
          arr: di.arr,
          mrr: di.mrr,
          grossMargin: di.grossMargin,
          burn: di.burn,
          runway: di.runway,
          headcount: di.headcount,
          cac: di.cac,
          ltv: di.ltv,
          nrr: di.nrr,
          cashBalance: di.cashBalance,
        })
      }

      // Annual reports
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'FINANCIAL_STATEMENT' as const,
        title: `${di.name} - 2023 Annual Report`,
        uploadDate: new Date(2024, 2, 15),
        url: '',
        parsedData: {},
      })

      // Cap table
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'CAP_TABLE' as const,
        title: `${di.name} - Capitalization Table (Dec 2024)`,
        uploadDate: new Date(2024, 11, 31),
        url: '',
        parsedData: {},
      })

      // Board materials
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'OTHER' as const,
        title: `${di.name} - Board Meeting Materials Q4 2024`,
        uploadDate: new Date(2024, 11, 15),
        url: '',
        parsedData: {},
      })
    } else if (di.investmentType === 'PRIVATE_DEBT') {
      // Quarterly interest statements
      for (let q = 0; q < 4; q++) {
        diDocuments.push({
          directInvestmentId: di.id,
          type: 'FINANCIAL_STATEMENT' as const,
          title: `${di.name} - Q${4 - q} 2024 Interest Statement`,
          uploadDate: new Date(2024, 9 - q * 3, 30),
          url: '',
          parsedData: {},
        })
      }

      // Credit rating report
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'OTHER' as const,
        title: `${di.name} - Credit Rating Report`,
        uploadDate: new Date(2024, 6, 30),
        url: '',
        parsedData: {},
      })
    } else if (di.investmentType === 'REAL_ESTATE') {
      // Property valuation reports
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'OTHER' as const,  // Changed from VALUATION_REPORT (not in enum)
        title: `${di.name} - Annual Appraisal Report 2024`,
        uploadDate: new Date(2024, 11, 31),
        url: '',
        parsedData: {},
      })

      // Rent roll
      for (let q = 0; q < 4; q++) {
        diDocuments.push({
          directInvestmentId: di.id,
          type: 'OTHER' as const,
          title: `${di.name} - Q${4 - q} 2024 Rent Roll`,
          uploadDate: new Date(2024, 9 - q * 3, 30),
          url: '',
          parsedData: {},
        })
      }
    } else if (di.investmentType === 'PUBLIC_EQUITY') {
      // Quarterly statements
      for (let q = 0; q < 4; q++) {
        diDocuments.push({
          directInvestmentId: di.id,
          type: 'FINANCIAL_STATEMENT' as const,
          title: `${di.tickerSymbol} - Q${4 - q} 2024 Portfolio Statement`,
          uploadDate: new Date(2024, 9 - q * 3, 30),
          url: '',
          parsedData: {},
        })
      }
    }
  }

  await prisma.directInvestmentDocument.createMany({
    data: diDocuments,
  })

  console.log(`✅ Created ${diDocuments.length} direct investment documents`)

  console.log('\n✅ ===== SEED COMPLETE ===== ✅\n')
  console.log('📊 Summary:')
  console.log(`   - Client: ${client.name}`)
  console.log(`   - User: ${user.email}`)
  console.log(`   - Funds: ${funds.length}`)
  console.log(`   - NAV History Entries: ${navHistoryCount}`)
  console.log(`   - Distributions: ${distributionData.length}`)
  console.log(`   - Fund Documents: ${fundDocuments.length}`)
  console.log(`   - Direct Investments: ${directInvestments.length}`)
  console.log(`   - DI Documents: ${diDocuments.length}`)
  console.log('\n🔐 Login Credentials:')
  console.log('   Email: demo@institutional-lp.com')
  console.log('   Password: demo123')
  console.log('\n📝 Note: All documents created WITHOUT PDF links (url field empty)')
  console.log('💼 Portfolio Value: ~$180M in funds + ~$115M in direct investments')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })


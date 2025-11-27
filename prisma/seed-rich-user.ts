import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing demo data (if any)...')

  const demoClientId = 'demo-client-rich'
  const demoUserEmail = 'demo@continental-lp.eu'

  // Remove dependent records tied to the demo client/user so seeding is idempotent
  await prisma.directInvestmentDocument.deleteMany({
    where: {
      directInvestment: {
        clientId: demoClientId,
      },
    },
  })

  await prisma.directInvestment.deleteMany({
    where: {
      clientId: demoClientId,
    },
  })

  await prisma.navHistory.deleteMany({
    where: {
      fund: {
        clientId: demoClientId,
      },
    },
  })

  await prisma.distribution.deleteMany({
    where: {
      fund: {
        clientId: demoClientId,
      },
    },
  })

  await prisma.document.deleteMany({
    where: {
      fund: {
        clientId: demoClientId,
      },
    },
  })

  await prisma.fund.deleteMany({
    where: {
      clientId: demoClientId,
    },
  })

  await prisma.user.deleteMany({
    where: {
      email: demoUserEmail,
    },
  })

  await prisma.client.deleteMany({
    where: {
      id: demoClientId,
    },
  })

  console.log('✅ Existing demo data cleared')
  console.log('🌱 Creating rich demo user with extensive portfolio...')

  // Create or find the client
  const client = await prisma.client.upsert({
    where: { id: demoClientId },
    update: {},
    create: {
      id: 'demo-client-rich',
      name: 'Continental Institutional Investors',
      email: 'invest@continental-lp.eu',
      phone: '+44 20 7123 4567',
      address: '25 Fenchurch Avenue, London EC3M 5AD, United Kingdom',
      notes: 'Family office with €300M+ AUM focused on European PE/VC investments',
    },
  })

  console.log('✅ Client created:', client.name)

  // Create the rich demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {},
    create: {
      email: demoUserEmail,
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

  // Fund 1: Nordic Founders Fund XII (Top performing VC fund)
  const fund1 = await prisma.fund.create({
    data: {
      name: 'Nordic Founders Fund XII',
      manager: 'Nordic Founders Management',
      managerEmail: 'ir@nordicfounders.eu',
      managerPhone: '+46-8-854-3927',
      managerWebsite: 'https://www.nordicfounders.eu',
      vintage: 2018,
      domicile: 'Luxembourg',
      commitment: 1500000,
      paidIn: 1200000,
      nav: 1950000,
      irr: 0.38,
      tvpi: 2.62,
      dpi: 0.36,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Venture Capital',
      strategy: 'Early Stage Tech',
      sector: 'Technology',
      baseCurrency: 'EUR',
      leverage: 0,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Portfolio company Helios AI raised €120M Series D at €1.2B valuation (unicorn status)\n- DataCore reached €25M ARR with 98% gross retention\n- Partial exit from CloudNordic at 3.8x realized return\n- 75% of portfolio companies beating revenue targets',
      lowlights: '- MobileTech facing competitive pressure from Meta and Google\n- Two seed-stage companies running low on runway\n- Macro headwinds impacting late-stage valuations by ~15%',
      milestones: '- Helios AI became the fund\'s first unicorn\n- DataCore achieved profitability ahead of plan\n- Completed €50M follow-on round across top 5 performers\n- Fund ranked top quartile by Preqin for vintage year',
      recentRounds: '- Helios AI: €120M Series D led by Sequoia at €1.2B valuation\n- DataCore: €35M Series C led by Index Ventures\n- CloudNordic: €25M growth round from strategic buyer\n- HealthTech Oslo: €15M Series B extension',
      capTableChanges: '- Increased ownership in Helios AI from 8% to 11% via pro-rata rights\n- Partial exit from CloudNordic (sold 40% stake to Cisco)\n- Down round protection triggered for MobileTech\n- Fund ownership consolidated across 18 active companies',
    },
  })
  funds.push(fund1)

  // Fund 2: Baltic Tech Growth Fund VI (Tech-focused VC)
  const fund2 = await prisma.fund.create({
    data: {
      name: 'Baltic Tech Growth Fund VI',
      manager: 'Baltic Tech Partners',
      managerEmail: 'lp@baltictech.eu',
      managerPhone: '+371-6-87-3130',
      managerWebsite: 'https://www.baltictech.eu',
      vintage: 2019,
      domicile: 'Estonia',
      commitment: 1300000,
      paidIn: 1000000,
      nav: 1850000,
      irr: 0.32,
      tvpi: 2.14,
      dpi: 0.28,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Venture Capital',
      strategy: 'Growth Equity',
      sector: 'Technology',
      baseCurrency: 'EUR',
      leverage: 0,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Portfolio generating €180M+ in aggregate ARR (up 65% YoY)\n- FinConnect preparing for IPO on Nasdaq Tallinn in H2 2025\n- EduTech platform expanded to 12 European countries\n- Fund distributed €280K in realized gains from partial exits',
      lowlights: '- AdTech company facing GDPR compliance challenges\n- Two companies experiencing higher-than-planned burn rates\n- Delayed Series B round for LogiTech due to market conditions',
      milestones: '- FinConnect appointed IPO advisors and filed S-1 prospectus\n- EduTech crossed 5M active users milestone\n- Fund completed successful €15M follow-on round\n- Baltic Tech recognized as "Top 10 Growth Funds" by TechCrunch',
      recentRounds: '- FinConnect: Pre-IPO bridge round at €450M valuation\n- EduTech: €40M Series C led by General Atlantic\n- LogiTech: €18M Series B from European strategic investors\n- AdTech: €8M bridge financing to extend runway',
      capTableChanges: '- Pre-IPO secondary sale of 15% stake in FinConnect\n- Increased ownership in EduTech to 18% via pro-rata\n- Partial exit from legacy seed investment Baltic Analytics\n- Fund now concentrated in top 8 performers',
    },
  })
  funds.push(fund2)

  // Fund 3: Alpine Growth Fund IV (Growth equity)
  const fund3 = await prisma.fund.create({
    data: {
      name: 'Alpine Growth Fund IV',
      manager: 'Alpine Capital Partners',
      managerEmail: 'operations@alpinegrowth.eu',
      managerPhone: '+41-44-614-4800',
      managerWebsite: 'https://www.alpinegrowth.eu',
      vintage: 2020,
      domicile: 'Switzerland',
      commitment: 1400000,
      paidIn: 1150000,
      nav: 1750000,
      irr: 0.24,
      tvpi: 1.75,
      dpi: 0.25,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Growth Equity',
      strategy: 'Upper Mid-Market',
      sector: 'Technology',
      baseCurrency: 'CHF',
      leverage: 0.15,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- SwissTech Solutions revenue grew 45% to CHF 85M\n- Completed add-on acquisition for flagship portfolio company\n- All 6 core investments achieved or exceeded operating plans\n- Fund on track for top-quartile performance',
      lowlights: '- Currency headwinds (EUR/CHF) impacted returns by ~3%\n- One portfolio company facing integration challenges post-acquisition\n- Slower-than-expected exit market for mid-market tech companies',
      milestones: '- SwissTech expanded to DACH region with 5 new offices\n- Completed CHF 35M bolt-on acquisition for portfolio company\n- Fund surpassed CHF 100M in aggregate portfolio revenue\n- Alpine ranked in top 15% of European growth funds by Cambridge Associates',
      recentRounds: '- SwissTech: CHF 45M growth capital for international expansion\n- DataVault: CHF 28M Series C from strategic corporate investor\n- CloudSecure: CHF 20M follow-on financing at step-up valuation',
      capTableChanges: '- Consolidated ownership in SwissTech to 32% (largest position)\n- Reduced stake in mature portfolio company MedTech from 25% to 18%\n- Fund fully deployed with no dry powder remaining',
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
      commitment: 1900000,
      paidIn: 1650000,
      nav: 2050000,
      irr: 0.18,
      tvpi: 1.65,
      dpi: 0.45,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Buyout',
      strategy: 'Mega Buyout',
      sector: 'Multi-sector',
      baseCurrency: 'GBP',
      leverage: 0.45,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Full exit from European Telecom Services at 2.8x MOIC (£450M proceeds)\n- Healthcare platform company EBITDA up 35% YoY to £185M\n- Industrial Services completed 3 strategic add-on acquisitions\n- Fund distributed £742K to LPs in Q4 2024',
      lowlights: '- UK retail investment facing post-Brexit supply chain challenges\n- Higher interest rates impacting leveraged portfolio performance\n- One portfolio company covenant waiver negotiations ongoing',
      milestones: '- Completed landmark £1.2B exit of European Telecom Services to Orange\n- Healthcare platform achieved market leadership in 8 European countries\n- Fund surpassed £3B in aggregate enterprise value across portfolio\n- KKR European Fund V in top decile for 2017 vintage per Pitchbook',
      recentRounds: '- Healthcare Platform: £250M refinancing at improved terms\n- Industrial Services: £180M debt facility for M&A pipeline\n- Consumer Brands: £95M growth capital for digital transformation',
      capTableChanges: '- Complete exit from European Telecom Services (realized 2.8x)\n- Recap of Healthcare Platform returned 1.2x while maintaining 65% ownership\n- Fund now holds 8 platform investments across Europe\n- Portfolio weighted toward healthcare (40%) and industrial services (35%)',
    },
  })
  funds.push(fund4)

  // Fund 5: Aurora Secondary Opportunities VIII (Secondaries)
  const fund5 = await prisma.fund.create({
    data: {
      name: 'Aurora Secondary Opportunities VIII',
      manager: 'Aurora Capital Europe',
      managerEmail: 'ir@auroracap.eu',
      managerPhone: '+352-26-583-500',
      managerWebsite: 'https://www.auroracap.eu',
      vintage: 2019,
      domicile: 'Luxembourg',
      commitment: 1750000,
      paidIn: 1450000,
      nav: 1900000,
      irr: 0.16,
      tvpi: 1.52,
      dpi: 0.29,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Secondaries',
      strategy: 'Secondary Investments',
      sector: 'Multi-sector',
      baseCurrency: 'EUR',
      leverage: 0.2,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Acquired €85M in secondaries at 15% average discount to NAV\n- Underlying funds generating strong distributions (€420K received in Q4)\n- Portfolio weighted toward top-quartile vintage years (2016-2019)\n- J-curve significantly mitigated through secondary strategy',
      lowlights: '- Secondary market pricing improved, reducing discount opportunities\n- Two underlying fund managers delayed exits due to market volatility\n- Limited GP-led continuation fund opportunities in Q4',
      milestones: '- Completed 12 secondary transactions totaling €85M in 2024\n- Portfolio exposure spans 45 underlying funds and 250+ companies\n- Fund received €580K in distributions from underlying investments\n- Aurora ranked as top 5 European secondary fund by Setter Capital',
      recentRounds: '- Acquired €35M stake in Nordic Tech Fund III at 12% discount\n- Purchased €28M in Sequoia Europe secondaries at 18% discount\n- Participated in €22M GP-led continuation vehicle',
      capTableChanges: '- Portfolio now includes stakes in 45 underlying PE/VC funds\n- Increased exposure to 2017-2018 vintage (optimal maturity window)\n- Reduced tail-end exposure in older vintage funds\n- Geographic allocation: 45% Western Europe, 35% UK, 20% Nordics',
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
      commitment: 900000,
      paidIn: 600000,
      nav: 820000,
      irr: 0.22,
      tvpi: 1.28,
      dpi: 0.09,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Venture Capital',
      strategy: 'Seed/Early',
      sector: 'Technology',
      baseCurrency: 'CHF',
      leverage: 0,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Portfolio company Wiz acquired by Google for $1.2B (28x return on seed investment)\n- 18 of 25 portfolio companies successfully raised follow-on rounds\n- AI/ML companies showing exceptional growth (3x revenue YoY average)\n- Fund tracking toward top-decile performance for 2021 vintage',
      lowlights: '- Two seed companies shut down due to product-market fit challenges\n- Fundraising environment tightened for pre-revenue startups\n- Longer time to Series A (18 months avg vs 12 months historical)',
      milestones: '- Landmark exit: Wiz acquisition by Google generated 28x return\n- Portfolio aggregate ARR surpassed CHF 45M milestone\n- Index VII featured in TechCrunch as "Hottest European Seed Fund"\n- 5 companies achieved Series A "unicorn" valuations',
      recentRounds: '- AI Startup X: CHF 25M Series A led by Accel at CHF 150M valuation\n- Climate Tech Y: CHF 18M seed extension from breakthrough Energy\n- Enterprise SaaS Z: CHF 12M Series A led by Point Nine',
      capTableChanges: '- Complete exit from Wiz via Google acquisition (realized 28x)\n- Pro-rata participation in 12 follow-on rounds\n- Portfolio concentrated in AI/ML (35%), enterprise SaaS (30%), climate tech (20%)\n- Fund 67% deployed with CHF 300K dry powder remaining',
    },
  })
  funds.push(fund6)

  // Fund 7: Eurazeo Growth IV (Growth equity)
  const fund7 = await prisma.fund.create({
    data: {
      name: 'Eurazeo Growth IV',
      manager: 'Eurazeo Capital',
      managerEmail: 'ir@growth.eurazeo.com',
      managerPhone: '+33-1-56-43-70-00',
      managerWebsite: 'https://www.eurazeo.com',
      vintage: 2020,
      domicile: 'France',
      commitment: 1600000,
      paidIn: 1250000,
      nav: 1800000,
      irr: 0.21,
      tvpi: 1.58,
      dpi: 0.21,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Growth Equity',
      strategy: 'Late Stage Consumer',
      sector: 'Consumer Internet',
      baseCurrency: 'EUR',
      leverage: 0.2,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- E-commerce portfolio company Vestiaire Collective filed for IPO on Euronext\n- Consumer marketplace revenue grew 52% YoY to €320M aggregate\n- Digital health platform expanded to 15 European markets\n- Fund generated €262K in distributions from partial exits',
      lowlights: '- Consumer spending slowdown impacting GMV growth rates\n- One portfolio company facing increased customer acquisition costs\n- IPO market volatility delaying 2 planned public listings',
      milestones: '- Vestiaire Collective filed S-1 for €2.5B IPO on Euronext Paris\n- Digital health platform surpassed 8M active users\n- Portfolio aggregate GMV exceeded €1.5B milestone\n- Eurazeo Growth IV ranked top-quartile by PitchBook',
      recentRounds: '- Vestiaire Collective: €85M pre-IPO round at €2.5B valuation\n- Digital Health: €65M Series D from General Atlantic\n- Marketplace Platform: €45M growth round from Tiger Global',
      capTableChanges: '- Reduced pre-IPO stake in Vestiaire from 12% to 9% via secondary sale\n- Increased ownership in Digital Health to 15% through follow-on\n- Portfolio concentrated in top 5 performers (85% of NAV)\n- Fund 78% deployed with €350M dry powder for follow-ons',
    },
  })
  funds.push(fund7)

  // Fund 8: Helvetia Private Equity XIII (Global)
  const fund8 = await prisma.fund.create({
    data: {
      name: 'Helvetia Private Equity XIII',
      manager: 'Helvetia Capital Partners',
      managerEmail: 'info@helvetiacapital.eu',
      managerPhone: '+41-58-878-0600',
      managerWebsite: 'https://www.helvetiacapital.eu',
      vintage: 2018,
      domicile: 'Switzerland',
      commitment: 1700000,
      paidIn: 1400000,
      nav: 1950000,
      irr: 0.19,
      tvpi: 1.79,
      dpi: 0.50,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Buyout',
      strategy: 'Global Diversified',
      sector: 'Multi-sector',
      baseCurrency: 'CHF',
      leverage: 0.35,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Swiss manufacturing company EBITDA grew 28% to CHF 95M\n- Completed CHF 450M exit of healthcare services platform to strategic buyer\n- Portfolio EBITDA margins expanded from 18% to 22% average\n- Fund distributed CHF 700K to LPs in Q4 2024',
      lowlights: '- CHF strength impacting export-oriented portfolio companies\n- One industrial services company facing supply chain disruptions\n- Exit timeline extended for mature investment due to buyer financing delays',
      milestones: '- Landmark CHF 450M exit of healthcare platform (3.2x realized MOIC)\n- Swiss manufacturing achieved market leadership in specialty chemicals\n- Fund portfolio aggregate revenue surpassed CHF 1.2B\n- Helvetia XIII ranked top 15% globally by Cambridge Associates',
      recentRounds: '- Manufacturing: CHF 120M refinancing for international expansion\n- Industrial Services: CHF 85M add-on acquisition financing\n- Business Services: CHF 65M growth capital for digital transformation',
      capTableChanges: '- Complete exit from healthcare platform (realized 3.2x MOIC)\n- Recapitalization of manufacturing company returned 1.5x while retaining 70%\n- Portfolio reduced to 7 core platform investments\n- Geographic allocation: 60% Switzerland, 25% DACH, 15% Western Europe',
    },
  })
  funds.push(fund8)

  // Fund 9: Gaia Catalyst Fund XII (Multi-stage)
  const fund9 = await prisma.fund.create({
    data: {
      name: 'Gaia Catalyst Fund XII',
      manager: 'Gaia Catalyst Partners',
      managerEmail: 'team@gaia-catalyst.eu',
      managerPhone: '+31-20-234-7000',
      managerWebsite: 'https://www.gaiacatalyst.eu',
      vintage: 2021,
      domicile: 'Netherlands',
      commitment: 1100000,
      paidIn: 750000,
      nav: 900000,
      irr: 0.20,
      tvpi: 1.32,
      dpi: 0.14,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Venture Capital',
      strategy: 'Multi-stage',
      sector: 'Climate Tech',
      baseCurrency: 'EUR',
      leverage: 0,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Battery technology company signed €250M supply agreement with Volkswagen\n- Carbon capture startup achieved breakthrough 90% efficiency milestone\n- EU Green Deal policies accelerating adoption across portfolio\n- 14 of 18 companies secured government climate grants totaling €45M',
      lowlights: '- Regulatory approval delays for carbon credit verification platform\n- One solar company facing panel supply chain constraints\n- Longer commercialization timelines than initially projected',
      milestones: '- Battery tech validated for mass production with Volkswagen partnership\n- Carbon capture technology licensed to Shell and TotalEnergies\n- Portfolio prevented 2.8M tons of CO2 equivalent in 2024\n- Gaia XII recognized as "Top Climate Fund" by Cleantech Group',
      recentRounds: '- Battery Tech: €75M Series C led by Breakthrough Energy Ventures\n- Carbon Capture: €55M Series B from European strategic investors\n- Sustainable Materials: €35M growth round from climate-focused VCs',
      capTableChanges: '- Doubled down on battery tech with €8M follow-on investment\n- Portfolio concentrated in energy storage (40%), carbon tech (30%), materials (20%)\n- Fund 68% deployed with €352K reserved for pro-rata follow-ons',
    },
  })
  funds.push(fund9)

  // Fund 10: NovaLight Ventures XIV (Early-stage)
  const fund10 = await prisma.fund.create({
    data: {
      name: 'NovaLight Ventures XIV',
      manager: 'NovaLight Partners',
      managerEmail: 'contact@novalight.eu',
      managerPhone: '+31-20-234-8300',
      managerWebsite: 'https://www.novalight.eu',
      vintage: 2022,
      domicile: 'Netherlands',
      commitment: 850000,
      paidIn: 500000,
      nav: 620000,
      irr: 0.18,
      tvpi: 1.18,
      dpi: 0.05,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Venture Capital',
      strategy: 'Seed Deeptech',
      sector: 'Deep Tech',
      baseCurrency: 'EUR',
      leverage: 0,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Quantum computing startup secured €45M Series A from Google Ventures\n- Biotech company received FDA Fast Track designation\n- 8 of 12 portfolio companies published peer-reviewed research\n- Deep tech funding environment improving with AI boom',
      lowlights: '- Two companies experiencing longer R&D cycles than anticipated\n- Regulatory hurdles for medical device startup causing delays\n- Higher capital intensity requiring larger follow-on reserves',
      milestones: '- Quantum startup achieved 1000-qubit milestone (industry first)\n- Biotech entered Phase 2 clinical trials ahead of schedule\n- Portfolio companies filed 18 new patents in 2024\n- Fund featured in Nature as "Leading Deep Tech Investor"',
      recentRounds: '- Quantum Computing: €45M Series A led by Google Ventures at €280M valuation\n- Biotech: €32M Series B from specialized life sciences funds\n- Advanced Materials: €18M seed extension from Lux Capital',
      capTableChanges: '- Pro-rata participation in quantum computing Series A (maintained 12% stake)\n- Portfolio weighted toward quantum (25%), biotech (25%), advanced materials (20%)\n- Fund 59% deployed with €350K dry powder for follow-ons',
    },
  })
  funds.push(fund10)

  // Fund 11: Insight Europe Fund XII (Growth/Buyout)
  const fund11 = await prisma.fund.create({
    data: {
      name: 'Insight Europe Fund XII',
      manager: 'Insight Partners Europe',
      managerEmail: 'info@insighteurope.com',
      managerPhone: '+353-1-230-9200',
      managerWebsite: 'https://www.insighteurope.com',
      vintage: 2019,
      domicile: 'Ireland',
      commitment: 1350000,
      paidIn: 1100000,
      nav: 1550000,
      irr: 0.20,
      tvpi: 1.67,
      dpi: 0.33,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Growth Equity',
      strategy: 'Software Growth',
      sector: 'Software',
      baseCurrency: 'EUR',
      leverage: 0.25,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Enterprise software portfolio ARR grew 48% to €285M aggregate\n- Completed €180M exit of DevOps platform to Atlassian (2.4x MOIC)\n- All 9 companies achieved Rule of 40 efficiency metrics\n- Fund distributed €363K to LPs from exits and recaps',
      lowlights: '- Elongated sales cycles for large enterprise deals\n- One company facing competitive pressure from Microsoft\n- Delayed IPO for cybersecurity platform due to market conditions',
      milestones: '- DevOps platform acquired by Atlassian for €180M (2.4x return)\n- Cybersecurity company surpassed €50M ARR milestone\n- Portfolio Net Revenue Retention averaging 125% across companies\n- Insight Europe XII ranked top quartile by Battery Ventures benchmarks',
      recentRounds: '- Cybersecurity: €85M growth round from strategic investor at €650M valuation\n- Marketing Automation: €65M Series D led by General Catalyst\n- Data Analytics: €45M growth capital from existing investors',
      capTableChanges: '- Complete exit from DevOps platform to Atlassian\n- Recap of marketing automation returned 1.1x while maintaining 55% ownership\n- Portfolio concentrated in cybersecurity (30%), data/analytics (25%), DevOps (20%)\n- Fund fully deployed with follow-on reserves only',
    },
  })
  funds.push(fund11)

  // Fund 12: Atlantic Growth Partners XI (Multi-stage)
  const fund12 = await prisma.fund.create({
    data: {
      name: 'Atlantic Growth Partners XI',
      manager: 'Atlantic Growth Partners',
      managerEmail: 'ir@atlanticgrowth.eu',
      managerPhone: '+353-1-687-5500',
      managerWebsite: 'https://www.atlanticgrowth.eu',
      vintage: 2020,
      domicile: 'Ireland',
      commitment: 1250000,
      paidIn: 1000000,
      nav: 1420000,
      irr: 0.19,
      tvpi: 1.54,
      dpi: 0.23,
      lastReportDate: new Date('2024-12-31'),
      assetClass: 'Multi-Strategy',
      strategy: 'Pan-European Growth',
      sector: 'Technology',
      baseCurrency: 'EUR',
      leverage: 0.2,
      preferredReturn: 0.08,
      clientId: client.id,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Diversified portfolio spanning 14 companies across 8 European countries\n- FinTech platform processed €5B in transaction volume (up 120% YoY)\n- Healthcare IT company expanded to 22 countries\n- Fund generated €230K in distributions from partial exits',
      lowlights: '- Geographic concentration risk with 45% exposure to UK market\n- One logistics company impacted by Brexit-related challenges\n- Currency volatility (GBP/EUR) created 4% FX headwind',
      milestones: '- FinTech achieved regulatory approval in all EU27 member states\n- Healthcare IT surpassed 15M patient records processed\n- Portfolio aggregate valuation increased 42% in 2024\n- Atlantic XI featured in Financial Times "Top 50 European Growth Funds"',
      recentRounds: '- FinTech: €95M Series D led by Stripe at €850M valuation\n- Healthcare IT: €70M growth round from strategic healthcare investor\n- Logistics Tech: €48M Series C from existing syndicate',
      capTableChanges: '- Secondary sale of 20% stake in mature FinTech investment\n- Pro-rata participation in healthcare IT growth round (maintained 14%)\n- Geographic rebalancing: reduced UK exposure from 50% to 45%\n- Fund 80% deployed with €250K reserved for follow-ons',
    },
  })
  funds.push(fund12)

  console.log(`✅ Created ${funds.length} funds`)

  // Create NAV history for all funds (rolling data ending at latest report)
  console.log('📈 Creating NAV history...')
  let navHistoryCount = 0

  for (const fund of funds) {
    const referenceDate = fund.lastReportDate || new Date()
    const quarters = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(referenceDate)
      date.setMonth(date.getMonth() - i * 3)
      const progress = 1 - i / 12
      const baseMultiplier = 0.6 + progress * 0.5
      const noise = 0.9 + Math.random() * 0.2
      const navValue = i === 0 ? fund.nav : Math.round(fund.nav * Math.min(1.2, baseMultiplier * noise))

      quarters.push({
        fundId: fund.id,
        date,
        nav: navValue,
      })
    }

    await prisma.navHistory.createMany({
      data: quarters,
    })
    navHistoryCount += quarters.length
  }

  console.log(`✅ Created ${navHistoryCount} NAV history entries`)

  // Create monthly rolling distributions and capital calls
  console.log('💰 Creating rolling cash flow history...')
  const distributionData: any[] = []
  const rollingCapitalCallDocs: any[] = []
  const historyMonths = 24
  const now = new Date()

  for (const fund of funds) {
    const totalPaidIn = fund.paidIn
    const totalDistributionTarget = fund.dpi * fund.paidIn
    let remainingCalls = totalPaidIn
    let remainingDistributions = totalDistributionTarget
    const distributionStart = 6

    for (let monthIndex = 0; monthIndex < historyMonths; monthIndex++) {
      const baseDate = new Date(now.getFullYear(), now.getMonth() - (historyMonths - monthIndex - 1), 1)

      if (remainingCalls > 0) {
        const monthsRemaining = historyMonths - monthIndex
        const baseline = remainingCalls / monthsRemaining
        const amount = monthIndex === historyMonths - 1
          ? Math.round(remainingCalls)
          : Math.max(75000, Math.round(baseline * (0.85 + Math.random() * 0.5)))
        remainingCalls = Math.max(0, remainingCalls - amount)

        rollingCapitalCallDocs.push({
          fundId: fund.id,
          type: 'CAPITAL_CALL',
          title: `${fund.name} - Monthly Capital Call ${monthIndex + 1}`,
          uploadDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 7 + Math.floor(Math.random() * 6)),
          dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 24),
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
          : Math.max(60000, Math.round(baseline * (0.8 + Math.random() * 0.5)))
        remainingDistributions = Math.max(0, remainingDistributions - amount)

        distributionData.push({
          fundId: fund.id,
          distributionDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 18),
          amount,
          distributionType: 'CASH',
          description: `${fund.name} distribution for ${baseDate.toLocaleString('default', { month: 'short' })} ${baseDate.getFullYear()}`,
          taxYear: baseDate.getFullYear(),
          k1Status: monthIndex >= historyMonths - 2 ? 'PENDING' : 'ISSUED',
        })
      }
    }
  }

  if (distributionData.length) {
    await prisma.distribution.createMany({
      data: distributionData,
    })
  }

  console.log(`✅ Created ${distributionData.length} distributions`)

  // Map fund IDs to names for readable distribution document titles
  const fundNameMap = funds.reduce<Record<string, string>>((acc, fund) => {
    acc[fund.id] = fund.name
    return acc
  }, {})

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

  // Add distribution documents with metrics matching the timeline
  if (distributionData.length) {
    for (const dist of distributionData) {
      const fundName = fundNameMap[dist.fundId] || 'Fund'
      const distDate = new Date(dist.distributionDate)
      const monthYear = distDate.toLocaleString('default', { month: 'short', year: 'numeric' })

      fundDocuments.push({
        fundId: dist.fundId,
        type: 'OTHER' as const,
        title: `${fundName} - Distribution Notice ${monthYear}`,
        uploadDate: dist.distributionDate,
        url: '',
        parsedData: {
          distributionDate: dist.distributionDate,
          amount: dist.amount,
          distributionType: dist.distributionType,
          taxYear: dist.taxYear,
          k1Status: dist.k1Status,
          description: dist.description,
        },
      })
    }
  }

  await prisma.document.createMany({
    data: fundDocuments,
  })

  console.log(`✅ Created ${fundDocuments.length} fund documents`)

  if (rollingCapitalCallDocs.length) {
    console.log(`📈 Added ${rollingCapitalCallDocs.length} historical capital call notices for time-series analytics`)
    await prisma.document.createMany({ data: rollingCapitalCallDocs })
  }

  // Create 15 diverse direct investments
  console.log('🏢 Creating direct investments...')

  const directInvestments = []

  // DI 1: SaaS Company - Series C
  const di1 = await prisma.directInvestment.create({
    data: {
      name: 'CloudScale Technologies GmbH',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Enterprise SaaS',
      stage: 'Series C',
      investmentDate: new Date('2022-03-15'),
      investmentAmount: 1200000,
      currentValue: 1850000,
      clientId: client.id,
      revenue: 3600000,
      arr: 4200000,
      mrr: 350000,
      grossMargin: 0.82,
      burn: 220000,
      runway: 32,
      headcount: 125,
      cac: 15000,
      ltv: 75000,
      nrr: 1.35,
      cashBalance: 5200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Signed 12 STOXX Europe 50 customers including Siemens and SAP\n- Launched AI-powered analytics platform for GDPR-compliant deployments\n- Achieved 135% net euro retention\n- Expanded with hubs in London, Paris, and Berlin',
      lowlights: '- Sales cycle extended to 7 months vs 5 month target\n- Engineering hiring behind plan by 15 positions across DACH region\n- Customer churn increased to 8% (from 5%)',
      milestones: '- Released CloudScale v3.0 with AI capabilities\n- Achieved SOC 2 Type II and ISO 27001 certifications\n- Expanded managed services presence across Europe\n- Reached €20M ARR milestone',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di1)

  // DI 2: FinTech - Series B
  const di2 = await prisma.directInvestment.create({
    data: {
      name: 'PayFlow Systems BV',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'FinTech',
      stage: 'Series B',
      investmentDate: new Date('2023-06-20'),
      investmentAmount: 900000,
      currentValue: 1350000,
      clientId: client.id,
      revenue: 2100000,
      arr: 2550000,
      mrr: 212000,
      grossMargin: 0.75,
      burn: 180000,
      runway: 28,
      headcount: 82,
      cac: 8000,
      ltv: 42000,
      nrr: 1.28,
      cashBalance: 3400000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Processed €1.1B in payment volume (up 180% YoY)\n- Launched embedded finance API for SEPA clients\n- Partnered with Visa, Mastercard, and Banco Santander\n- Achieved profitability milestone',
      lowlights: '- BaFin PSD2 approval delayed\n- Competition intensified from incumbent eurozone banks\n- Lost 2 key engineering leads in Amsterdam',
      milestones: '- Obtained e-money licences across the EU and UK\n- Reached 10,000 business customers\n- Launched instant SEPA payment rails\n- Achieved PCI DSS Level 1 certification',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di2)

  // DI 3: Healthcare IT - Series D
  const di3 = await prisma.directInvestment.create({
    data: {
      name: 'MediConnect Health SAS',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Healthcare Technology',
      stage: 'Series D',
      investmentDate: new Date('2021-09-10'),
      investmentAmount: 1500000,
      currentValue: 2450000,
      clientId: client.id,
      revenue: 5200000,
      arr: 6100000,
      mrr: 508000,
      grossMargin: 0.78,
      burn: 320000,
      runway: 40,
      headcount: 285,
      cac: 25000,
      ltv: 180000,
      nrr: 1.42,
      cashBalance: 6400000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Connected to 1,800 hospitals across the EU and UK\n- Launched AI-powered clinical decision support\n- Achieved GDPR and HDS certifications\n- Expanded into telehealth services',
      lowlights: '- CNIL compliance review (resolved)\n- Integration delays with Dedalus and TPP\n- Higher than expected cloud infrastructure costs',
      milestones: '- Processed 45M patient records\n- Launched interoperability platform\n- Acquired competitor MediSmart for €11M\n- Signed partnership with NHS Digital',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di3)

  // DI 4: AI/ML Startup - Series A
  const di4 = await prisma.directInvestment.create({
    data: {
      name: 'NeuralEdge AI Labs',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Artificial Intelligence',
      stage: 'Series A',
      investmentDate: new Date('2023-11-01'),
      investmentAmount: 85000,
      currentValue: 125000,
      clientId: client.id,
      revenue: 320000,
      arr: 420000,
      mrr: 35000,
      grossMargin: 0.85,
      burn: 90000,
      runway: 22,
      headcount: 35,
      cac: 12000,
      ltv: 55000,
      nrr: 1.15,
      cashBalance: 520000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Signed first 3 enterprise customers (SAP, Airbus, Schneider Electric)\n- Launched GPT-4 powered platform\n- Published 2 papers at NeurIPS\n- Hired former DeepMind research lead',
      lowlights: '- Longer sales cycles than expected (9 months)\n- GPU compute costs higher than budgeted\n- Lost key ML engineer to competitor',
      milestones: '- Processed 100M AI inference requests\n- Achieved 99.9% uptime SLA\n- Launched model marketplace\n- Raised additional $5M strategic round',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di4)

  // DI 5: E-commerce Platform - Series C
  const di5 = await prisma.directInvestment.create({
    data: {
      name: 'ShopDirect Commerce BV',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'E-commerce',
      stage: 'Series C',
      investmentDate: new Date('2022-07-15'),
      investmentAmount: 1100000,
      currentValue: 1750000,
      clientId: client.id,
      revenue: 4200000,
      arr: 5200000,
      mrr: 435000,
      grossMargin: 0.68,
      burn: 240000,
      runway: 30,
      headcount: 165,
      cac: 18000,
      ltv: 95000,
      nrr: 1.25,
      cashBalance: 5200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- GMV reached €240M (up 85% YoY)\n- Expanded to 15 new European countries\n- Launched B2B marketplace\n- Achieved unit economics profitability',
      lowlights: '- Fraud losses higher than expected at 0.8% of GMV\n- Warehouse automation delays\n- Customer acquisition costs increased 25%',
      milestones: '- Onboarded 50,000 sellers\n- Processed 2M orders per month\n- Launched same-day delivery in 10 EU cities\n- Integrated with Shopify and WooCommerce',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di5)

  // DI 6: Cybersecurity - Series B
  const di6 = await prisma.directInvestment.create({
    data: {
      name: 'SecureNet Defense GmbH',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Cybersecurity',
      stage: 'Series B',
      investmentDate: new Date('2023-02-20'),
      investmentAmount: 950000,
      currentValue: 1400000,
      clientId: client.id,
      revenue: 2800000,
      arr: 3400000,
      mrr: 285000,
      grossMargin: 0.80,
      burn: 180000,
      runway: 26,
      headcount: 95,
      cac: 20000,
      ltv: 110000,
      nrr: 1.38,
      cashBalance: 3600000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Detected and prevented 10,000+ cyber attacks\n- Achieved EU Cloud Code of Conduct certification\n- Expanded SOC to 24/7 operations\n- Signed 5 STOXX Europe 50 customers',
      lowlights: '- False positive rate higher than target (5% vs 2%)\n- Competition from CrowdStrike and SentinelOne\n- Security analyst retention at 75%',
      milestones: '- Raised €20M Series B led by Northzone\n- Launched AI-powered threat detection\n- Achieved ISO 27001 and ENS High certifications\n- Expanded across continental Europe',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di6)

  // DI 7: Private Debt - Corporate Bond
  const di7 = await prisma.directInvestment.create({
    data: {
      name: 'EuroTech Senior Notes 2028',
      investmentType: 'PRIVATE_DEBT',
      industry: 'Technology',
      investmentDate: new Date('2023-05-15'),
      investmentAmount: 450000,
      currentValue: 470000,
      clientId: client.id,
      principalAmount: 450000,
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

  // DI 8: Real Estate - Office Building (Dublin)
  const di8 = await prisma.directInvestment.create({
    data: {
      name: 'Docklands Tech Campus',
      investmentType: 'REAL_ESTATE',
      industry: 'Commercial Real Estate',
      investmentDate: new Date('2021-08-20'),
      investmentAmount: 1800000,
      currentValue: 2150000,
      clientId: client.id,
      propertyType: 'Commercial Office',
      propertyAddress: 'North Wall Quay, Dublin Docklands, Ireland',
      squareFootage: 185000,
      purchaseDate: new Date('2021-08-20'),
      purchaseValue: 1800000,
      currentAppraisal: 2150000,
      rentalIncome: 280000,
      occupancyRate: 0.82,
      propertyTax: 38000,
      maintenanceCost: 62000,
      netOperatingIncome: 180000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di8)

  // DI 8b: Real Estate - Residential (London)
  const di8b = await prisma.directInvestment.create({
    data: {
      name: 'Canary Wharf Residential Tower',
      investmentType: 'REAL_ESTATE',
      industry: 'Residential Real Estate',
      investmentDate: new Date('2022-03-10'),
      investmentAmount: 1200000,
      currentValue: 1450000,
      clientId: client.id,
      propertyType: 'Residential',
      propertyAddress: 'One Canada Square, Canary Wharf, London E14 5AB, United Kingdom',
      squareFootage: 125000,
      purchaseDate: new Date('2022-03-10'),
      purchaseValue: 1200000,
      currentAppraisal: 1450000,
      rentalIncome: 195000,
      occupancyRate: 0.95,
      propertyTax: 28000,
      maintenanceCost: 45000,
      netOperatingIncome: 122000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di8b)

  // DI 8c: Real Estate - Industrial (Amsterdam)
  const di8c = await prisma.directInvestment.create({
    data: {
      name: 'Amsterdam Logistics Hub',
      investmentType: 'REAL_ESTATE',
      industry: 'Industrial Real Estate',
      investmentDate: new Date('2023-01-15'),
      investmentAmount: 950000,
      currentValue: 1100000,
      clientId: client.id,
      propertyType: 'Industrial',
      propertyAddress: 'Schiphol Boulevard 127, 1118 BG Schiphol, Netherlands',
      squareFootage: 145000,
      purchaseDate: new Date('2023-01-15'),
      purchaseValue: 950000,
      currentAppraisal: 1100000,
      rentalIncome: 145000,
      occupancyRate: 0.88,
      propertyTax: 22000,
      maintenanceCost: 35000,
      netOperatingIncome: 88000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di8c)

  // DI 9: Public Equity - Tech Stock
  const di9 = await prisma.directInvestment.create({
    data: {
      name: 'ASML Holding N.V.',
      investmentType: 'PUBLIC_EQUITY',
      industry: 'Semiconductors',
      investmentDate: new Date('2023-01-15'),
      investmentAmount: 320000,
      currentValue: 680000,
      clientId: client.id,
      tickerSymbol: 'ASML',
      shares: 450,
      purchasePrice: 480,
      currentPrice: 680,
      dividends: 950,
      marketValue: 680000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di9)

  // DI 9b: Real Assets - Infrastructure (Germany)
  const di9b = await prisma.directInvestment.create({
    data: {
      name: 'Bavarian Solar Farm',
      investmentType: 'REAL_ASSETS',
      industry: 'Renewable Energy Infrastructure',
      investmentDate: new Date('2022-06-01'),
      investmentAmount: 1500000,
      currentValue: 1750000,
      clientId: client.id,
      assetType: 'Infrastructure',
      assetDescription: '50MW solar photovoltaic power plant',
      assetLocation: 'Bavaria, Germany',
      acquisitionDate: new Date('2022-06-01'),
      acquisitionValue: 1500000,
      assetCurrentValue: 1750000,
      assetIncome: 185000,
      holdingCost: 25000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di9b)

  // DI 9c: Real Assets - Natural Resources (Norway)
  const di9c = await prisma.directInvestment.create({
    data: {
      name: 'Nordic Timber Holdings',
      investmentType: 'REAL_ASSETS',
      industry: 'Natural Resources',
      investmentDate: new Date('2021-11-15'),
      investmentAmount: 850000,
      currentValue: 1100000,
      clientId: client.id,
      assetType: 'Natural Resource',
      assetDescription: 'Managed forest land with sustainable harvesting rights',
      assetLocation: 'Trondheim, Norway',
      acquisitionDate: new Date('2021-11-15'),
      acquisitionValue: 850000,
      assetCurrentValue: 1100000,
      assetIncome: 95000,
      holdingCost: 15000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di9c)

  // DI 9d: Real Assets - Art Collection (Switzerland)
  const di9d = await prisma.directInvestment.create({
    data: {
      name: 'Contemporary Art Collection',
      investmentType: 'REAL_ASSETS',
      industry: 'Art & Collectibles',
      investmentDate: new Date('2020-05-20'),
      investmentAmount: 650000,
      currentValue: 1250000,
      clientId: client.id,
      assetType: 'Art',
      assetDescription: 'Collection of contemporary European art pieces',
      assetLocation: 'Zurich, Switzerland',
      acquisitionDate: new Date('2020-05-20'),
      acquisitionValue: 650000,
      assetCurrentValue: 1250000,
      assetIncome: 0,
      holdingCost: 12000,
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di9d)

  // DI 10: DevOps/Infrastructure - Series B
  const di10 = await prisma.directInvestment.create({
    data: {
      name: 'KubeFlow Systems GmbH',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Developer Tools',
      stage: 'Series B',
      investmentDate: new Date('2023-04-10'),
      investmentAmount: 950000,
      currentValue: 1450000,
      clientId: client.id,
      revenue: 2500000,
      arr: 3100000,
      mrr: 260000,
      grossMargin: 0.88,
      burn: 150000,
      runway: 30,
      headcount: 68,
      cac: 9500,
      ltv: 62000,
      nrr: 1.32,
      cashBalance: 3200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Reached 5,000 enterprise customers\n- Launched managed Kubernetes service\n- Integrated with all major cloud providers\n- 98% customer satisfaction score',
      lowlights: '- Competition from HashiCorp intensified\n- Open source community engagement declined\n- Pricing pressure from cloud providers',
      milestones: '- Processed 100M container deployments\n- Achieved SOC 2 Type II certification\n- Launched enterprise support tier\n- Expanded managed clusters across Europe',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di10)

  // DI 11: Climate Tech - Series C
  const di11 = await prisma.directInvestment.create({
    data: {
      name: 'GreenTech Carbon Solutions BV',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Climate Technology',
      stage: 'Series C',
      investmentDate: new Date('2022-05-15'),
      investmentAmount: 1250000,
      currentValue: 1950000,
      clientId: client.id,
      revenue: 3200000,
      arr: 4100000,
      mrr: 345000,
      grossMargin: 0.72,
      burn: 260000,
      runway: 28,
      headcount: 145,
      cac: 22000,
      ltv: 145000,
      nrr: 1.35,
      cashBalance: 4200000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Offset 2.5M tons of CO2 equivalent\n- Signed contracts with 150 Euro Stoxx corporates\n- Launched carbon credit marketplace\n- Received B Corp certification',
      lowlights: '- Regulatory uncertainty in carbon markets\n- Competition from Stripe Climate\n- Project development slower than expected',
      milestones: '- Raised €50M Series C led by Breakthrough Energy\n- Expanded to 15 European countries\n- Launched reforestation programme in Portugal\n- Achieved carbon negative operations',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di11)

  // DI 12: EdTech - Series B
  const di12 = await prisma.directInvestment.create({
    data: {
      name: 'LearnSmart Platform AB',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Education Technology',
      stage: 'Series B',
      investmentDate: new Date('2023-09-01'),
      investmentAmount: 95000,
      currentValue: 145000,
      clientId: client.id,
      revenue: 1200000,
      arr: 1450000,
      mrr: 120000,
      grossMargin: 0.76,
      burn: 90000,
      runway: 24,
      headcount: 88,
      cac: 450,
      ltv: 3200,
      nrr: 1.18,
      cashBalance: 480000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Reached 2.5M active learners\n- Partnered with 1,200 schools and universities\n- Launched AI tutoring assistant\n- Achieved 95% course completion rate',
      lowlights: '- Slower B2C adoption than expected\n- Competition from Coursera and Udacity\n- Content creation costs higher than budgeted',
      milestones: '- Launched 500 new courses\n- Expanded to DACH and Nordic markets\n- Achieved GDPR and ePrivacy compliance\n- Integrated with Moodle and Blackboard',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di12)

  // DI 13: Logistics Tech - Series C
  const di13 = await prisma.directInvestment.create({
    data: {
      name: 'FreightOptimize AI Ltd',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Supply Chain & Logistics',
      stage: 'Series C',
      investmentDate: new Date('2022-11-20'),
      investmentAmount: 1150000,
      currentValue: 1750000,
      clientId: client.id,
      revenue: 3200000,
      arr: 3800000,
      mrr: 320000,
      grossMargin: 0.70,
      burn: 210000,
      runway: 32,
      headcount: 132,
      cac: 28000,
      ltv: 165000,
      nrr: 1.28,
      cashBalance: 3800000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Optimized €1.7B in freight spend\n- AI reduced shipping costs by avg 18%\n- Signed 8 of top 10 European retailers\n- Expanded to ocean and air freight',
      lowlights: '- Supply chain disruptions impacted adoption\n- Integration complexity with legacy TMS systems\n- Competition from incumbents like Oracle',
      milestones: '- Processed 500K shipments per month\n- Launched predictive ETscript analytics\n- Achieved 99.5% on-time delivery\n- Expanded pan-European network',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di13)

  // DI 14: Biotech - Series A
  const di14 = await prisma.directInvestment.create({
    data: {
      name: 'GenomeCure Therapeutics GmbH',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Biotechnology',
      stage: 'Series A',
      investmentDate: new Date('2023-08-15'),
      investmentAmount: 70000,
      currentValue: 115000,
      clientId: client.id,
      revenue: 420000,
      burn: 65000,
      runway: 18,
      headcount: 42,
      cashBalance: 320000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Completed Phase 1 clinical trials successfully\n- EMA granted PRIME designation\n- Published positive data in Nature Medicine\n- Partnered with Roche for distribution',
      lowlights: '- Phase 2 trials delayed by 6 months\n- Patient recruitment slower than expected\n- Manufacturing scale-up challenges',
      milestones: '- Initiated Phase 2 trials in oncology\n- Received €3M Horizon Europe grant\n- Hired former Novartis CMO\n- Filed 3 new patent applications',
      lastReportDate: new Date('2024-12-31'),
    },
  })
  directInvestments.push(di14)

  // DI 15: Consumer Tech - Series B
  const di15 = await prisma.directInvestment.create({
    data: {
      name: 'WearableHealth Devices AB',
      investmentType: 'PRIVATE_EQUITY',
      industry: 'Consumer Electronics',
      stage: 'Series B',
      investmentDate: new Date('2023-03-01'),
      investmentAmount: 420000,
      currentValue: 680000,
      clientId: client.id,
      revenue: 1850000,
      arr: 920000,
      mrr: 76000,
      grossMargin: 0.58,
      burn: 140000,
      runway: 26,
      headcount: 98,
      cac: 85,
      ltv: 420,
      nrr: 1.22,
      cashBalance: 2600000,
      period: 'Q4 2024',
      periodDate: new Date('2024-12-31'),
      highlights: '- Sold 250K devices (up 180% YoY)\n- Launched in leading European electronics retailers\n- Received MDR clearance for blood pressure monitoring\n- Partnership with AllianzCare',
      lowlights: '- Supply chain issues with chip shortage\n- Competition from Apple Watch intensified\n- Customer retention at 65% (below 75% target)',
      milestones: '- Reached 500K active users\n- Launched premium subscription service (€9.99/mo)\n- Expanded to 12 European countries\n- Achieved CE Mark certification for EU',
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
    } else if (di.investmentType === 'REAL_ASSETS') {
      // Annual valuation reports
      diDocuments.push({
        directInvestmentId: di.id,
        type: 'OTHER' as const,
        title: `${di.name} - Annual Valuation Report 2024`,
        uploadDate: new Date(2024, 11, 31),
        url: '',
        parsedData: {},
      })

      // Quarterly performance reports
      for (let q = 0; q < 4; q++) {
        diDocuments.push({
          directInvestmentId: di.id,
          type: 'OTHER' as const,
          title: `${di.name} - Q${4 - q} 2024 Performance Report`,
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
  console.log('   Email: demo@continental-lp.eu')
  console.log('   Password: demo123')
  console.log('\n📝 Note: All documents are created initially WITHOUT PDF links (url field empty).')
  console.log('    Run "npm run demo:generate-pdfs" after this seed to generate demo PDFs and populate document URLs for the rich demo user.')
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

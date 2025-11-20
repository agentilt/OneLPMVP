# Risk Management & Analytics - Implementation Plan

## 🎯 Executive Summary

Implementing comprehensive risk management and analytics is a **major enterprise feature** that requires:
- **Time Estimate**: 2-3 weeks of development
- **Complexity**: High (financial modeling, statistical analysis)
- **Database Changes**: Moderate (new models, indexes)
- **UI Components**: 15+ new components
- **API Endpoints**: 8-10 new endpoints

## 📊 Feature Breakdown

### **Priority 1: Foundation (Week 1)**
Essential risk metrics and data structure

### **Priority 2: Advanced Analytics (Week 2)**
Statistical analysis and modeling

### **Priority 3: Visualizations & UX (Week 3)**
Interactive dashboards and reporting

---

## 🗄️ Phase 1: Database Schema & Data Model

### **1.1 New Prisma Models**

```prisma
// Risk Policy Configuration
model RiskPolicy {
  id                    String   @id @default(cuid())
  clientId              String?
  userId                String?  // For individual user overrides
  
  // Concentration Limits (as percentages)
  maxSingleFundExposure       Float   @default(25)  // % of total portfolio
  maxGeographyExposure        Float   @default(40)
  maxSectorExposure           Float   @default(35)
  maxVintageExposure          Float   @default(30)
  maxManagerExposure          Float   @default(20)
  
  // Liquidity Constraints
  maxUnfundedCommitments      Float   @default(50)  // % of total commitment
  minLiquidityReserve         Float   @default(10)  // % cash reserve
  
  // Other Risk Limits
  maxCurrencyExposure         Float   @default(30)
  targetDiversificationScore  Float   @default(0.7) // 0-1 scale
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  client                Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user                  User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
  @@index([userId])
}

// Risk Snapshot (calculated periodically)
model RiskSnapshot {
  id                    String   @id @default(cuid())
  clientId              String?
  userId                String?
  snapshotDate          DateTime @default(now())
  
  // Concentration Metrics
  concentrationByFund         Json  // { fundId: percentage }
  concentrationByGeography    Json  // { region: percentage }
  concentrationBySector       Json  // { sector: percentage }
  concentrationByVintage      Json  // { year: percentage }
  
  // Risk Scores (0-100, higher = more risk)
  overallRiskScore      Float
  concentrationRiskScore Float
  liquidityRiskScore    Float
  currencyRiskScore     Float
  
  // Portfolio Statistics
  portfolioValue        Float
  unfundedCommitments   Float
  liquidityRatio        Float
  diversificationIndex  Float  // Herfindahl-Hirschman Index
  
  // Value at Risk
  varDaily95            Float?  // VaR at 95% confidence
  varMonthly95          Float?
  expectedShortfall     Float?  // CVaR
  
  // Alerts (violations)
  violations            Json    // Array of policy violations
  
  createdAt             DateTime @default(now())
  
  client                Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user                  User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([clientId, snapshotDate])
  @@index([userId, snapshotDate])
  @@index([snapshotDate])
}

// Scenario Analysis Results
model ScenarioAnalysis {
  id                    String   @id @default(cuid())
  clientId              String?
  userId                String
  name                  String
  description           String?
  scenarioType          String   // 'STRESS_TEST' | 'MONTE_CARLO' | 'HISTORICAL'
  
  // Scenario Parameters
  parameters            Json     // Shock assumptions
  
  // Results
  expectedImpact        Float    // Dollar impact
  portfolioValueChange  Float    // % change
  affectedFunds         Json     // Array of impacted funds
  recoveryTimeMonths    Int?     // Estimated recovery
  
  createdAt             DateTime @default(now())
  createdBy             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  client                Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
  @@index([userId])
  @@index([createdAt])
}

// Add to existing Fund model
model Fund {
  // ... existing fields ...
  
  // Risk Classification
  sector                String?   // 'Technology', 'Healthcare', etc.
  subSector             String?   // More granular
  riskRating            String?   // 'LOW' | 'MEDIUM' | 'HIGH'
  
  // Currency Exposure
  currency              String    @default("USD")
  currencyHedged        Boolean   @default(false)
  
  // Liquidity
  liquidityClass        String?   // 'LIQUID' | 'SEMI_LIQUID' | 'ILLIQUID'
  expectedExitDate      DateTime?
}

// Add to existing DirectInvestment model
model DirectInvestment {
  // ... existing fields ...
  
  sector                String?
  subSector             String?
  riskRating            String?
  currency              String    @default("USD")
  liquidityClass        String?
}
```

### **1.2 Database Migration**

```sql
-- migrations/add_risk_management.sql

-- 1. Create RiskPolicy table
CREATE TABLE "RiskPolicy" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT,
    "maxSingleFundExposure" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "maxGeographyExposure" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "maxSectorExposure" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "maxVintageExposure" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "maxManagerExposure" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "maxUnfundedCommitments" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "minLiquidityReserve" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "maxCurrencyExposure" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "targetDiversificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskPolicy_pkey" PRIMARY KEY ("id")
);

-- 2. Create RiskSnapshot table
CREATE TABLE "RiskSnapshot" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concentrationByFund" JSONB NOT NULL,
    "concentrationByGeography" JSONB NOT NULL,
    "concentrationBySector" JSONB NOT NULL,
    "concentrationByVintage" JSONB NOT NULL,
    "overallRiskScore" DOUBLE PRECISION NOT NULL,
    "concentrationRiskScore" DOUBLE PRECISION NOT NULL,
    "liquidityRiskScore" DOUBLE PRECISION NOT NULL,
    "currencyRiskScore" DOUBLE PRECISION NOT NULL,
    "portfolioValue" DOUBLE PRECISION NOT NULL,
    "unfundedCommitments" DOUBLE PRECISION NOT NULL,
    "liquidityRatio" DOUBLE PRECISION NOT NULL,
    "diversificationIndex" DOUBLE PRECISION NOT NULL,
    "varDaily95" DOUBLE PRECISION,
    "varMonthly95" DOUBLE PRECISION,
    "expectedShortfall" DOUBLE PRECISION,
    "violations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskSnapshot_pkey" PRIMARY KEY ("id")
);

-- 3. Create ScenarioAnalysis table
CREATE TABLE "ScenarioAnalysis" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scenarioType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "expectedImpact" DOUBLE PRECISION NOT NULL,
    "portfolioValueChange" DOUBLE PRECISION NOT NULL,
    "affectedFunds" JSONB NOT NULL,
    "recoveryTimeMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioAnalysis_pkey" PRIMARY KEY ("id")
);

-- 4. Add risk fields to Fund table
ALTER TABLE "Fund" 
ADD COLUMN "sector" TEXT,
ADD COLUMN "subSector" TEXT,
ADD COLUMN "riskRating" TEXT,
ADD COLUMN "currency" TEXT DEFAULT 'USD',
ADD COLUMN "currencyHedged" BOOLEAN DEFAULT false,
ADD COLUMN "liquidityClass" TEXT,
ADD COLUMN "expectedExitDate" TIMESTAMP(3);

-- 5. Add risk fields to DirectInvestment table
ALTER TABLE "DirectInvestment"
ADD COLUMN "sector" TEXT,
ADD COLUMN "subSector" TEXT,
ADD COLUMN "riskRating" TEXT,
ADD COLUMN "currency" TEXT DEFAULT 'USD',
ADD COLUMN "liquidityClass" TEXT;

-- 6. Create indexes
CREATE INDEX "RiskPolicy_clientId_idx" ON "RiskPolicy"("clientId");
CREATE INDEX "RiskPolicy_userId_idx" ON "RiskPolicy"("userId");
CREATE INDEX "RiskSnapshot_clientId_snapshotDate_idx" ON "RiskSnapshot"("clientId", "snapshotDate");
CREATE INDEX "RiskSnapshot_userId_snapshotDate_idx" ON "RiskSnapshot"("userId", "snapshotDate");
CREATE INDEX "RiskSnapshot_snapshotDate_idx" ON "RiskSnapshot"("snapshotDate");
CREATE INDEX "ScenarioAnalysis_clientId_idx" ON "ScenarioAnalysis"("clientId");
CREATE INDEX "ScenarioAnalysis_userId_idx" ON "ScenarioAnalysis"("userId");
CREATE INDEX "ScenarioAnalysis_createdAt_idx" ON "ScenarioAnalysis"("createdAt");

-- 7. Add foreign key constraints
ALTER TABLE "RiskPolicy" ADD CONSTRAINT "RiskPolicy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskPolicy" ADD CONSTRAINT "RiskPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskSnapshot" ADD CONSTRAINT "RiskSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskSnapshot" ADD CONSTRAINT "RiskSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioAnalysis" ADD CONSTRAINT "ScenarioAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioAnalysis" ADD CONSTRAINT "ScenarioAnalysis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 🔧 Phase 2: Backend Logic & Calculations

### **2.1 Risk Calculation Engine**

```typescript
// src/lib/risk-calculator.ts

import { prisma } from './db'

export interface PortfolioRiskMetrics {
  concentrationByFund: Record<string, number>
  concentrationByGeography: Record<string, number>
  concentrationBySector: Record<string, number>
  concentrationByVintage: Record<string, number>
  overallRiskScore: number
  concentrationRiskScore: number
  liquidityRiskScore: number
  currencyRiskScore: number
  portfolioValue: number
  unfundedCommitments: number
  liquidityRatio: number
  diversificationIndex: number
  violations: PolicyViolation[]
}

export interface PolicyViolation {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  metric: string
  current: number
  limit: number
  message: string
}

export class RiskCalculator {
  /**
   * Calculate Herfindahl-Hirschman Index (HHI)
   * Measures portfolio concentration (0 = perfect diversification, 1 = single asset)
   */
  private calculateHHI(weights: number[]): number {
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0)
  }

  /**
   * Calculate concentration by dimension
   */
  private calculateConcentration(
    items: any[],
    groupByField: string,
    valueField: string
  ): Record<string, number> {
    const totalValue = items.reduce((sum, item) => sum + (item[valueField] || 0), 0)
    const grouped = items.reduce((acc, item) => {
      const key = item[groupByField] || 'Unknown'
      acc[key] = (acc[key] || 0) + (item[valueField] || 0)
      return acc
    }, {} as Record<string, number>)

    // Convert to percentages
    return Object.entries(grouped).reduce((acc, [key, value]) => {
      acc[key] = totalValue > 0 ? (value / totalValue) * 100 : 0
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Check policy violations
   */
  private checkViolations(
    metrics: Partial<PortfolioRiskMetrics>,
    policy: any
  ): PolicyViolation[] {
    const violations: PolicyViolation[] = []

    // Check single fund concentration
    if (metrics.concentrationByFund) {
      Object.entries(metrics.concentrationByFund).forEach(([fund, percentage]) => {
        if (percentage > policy.maxSingleFundExposure) {
          violations.push({
            type: 'CONCENTRATION_FUND',
            severity: percentage > policy.maxSingleFundExposure * 1.5 ? 'CRITICAL' : 'HIGH',
            metric: 'Single Fund Exposure',
            current: percentage,
            limit: policy.maxSingleFundExposure,
            message: `${fund}: ${percentage.toFixed(1)}% exceeds limit of ${policy.maxSingleFundExposure}%`,
          })
        }
      })
    }

    // Check geography concentration
    if (metrics.concentrationByGeography) {
      Object.entries(metrics.concentrationByGeography).forEach(([geo, percentage]) => {
        if (percentage > policy.maxGeographyExposure) {
          violations.push({
            type: 'CONCENTRATION_GEOGRAPHY',
            severity: percentage > policy.maxGeographyExposure * 1.3 ? 'HIGH' : 'MEDIUM',
            metric: 'Geography Exposure',
            current: percentage,
            limit: policy.maxGeographyExposure,
            message: `${geo}: ${percentage.toFixed(1)}% exceeds limit of ${policy.maxGeographyExposure}%`,
          })
        }
      })
    }

    // Check sector concentration
    if (metrics.concentrationBySector) {
      Object.entries(metrics.concentrationBySector).forEach(([sector, percentage]) => {
        if (percentage > policy.maxSectorExposure) {
          violations.push({
            type: 'CONCENTRATION_SECTOR',
            severity: percentage > policy.maxSectorExposure * 1.3 ? 'HIGH' : 'MEDIUM',
            metric: 'Sector Exposure',
            current: percentage,
            limit: policy.maxSectorExposure,
            message: `${sector}: ${percentage.toFixed(1)}% exceeds limit of ${policy.maxSectorExposure}%`,
          })
        }
      })
    }

    // Check liquidity
    if (metrics.unfundedCommitments && metrics.portfolioValue) {
      const unfundedRatio =
        (metrics.unfundedCommitments / (metrics.portfolioValue + metrics.unfundedCommitments)) * 100
      if (unfundedRatio > policy.maxUnfundedCommitments) {
        violations.push({
          type: 'LIQUIDITY',
          severity: unfundedRatio > policy.maxUnfundedCommitments * 1.2 ? 'HIGH' : 'MEDIUM',
          metric: 'Unfunded Commitments',
          current: unfundedRatio,
          limit: policy.maxUnfundedCommitments,
          message: `Unfunded commitments at ${unfundedRatio.toFixed(1)}% exceed limit of ${policy.maxUnfundedCommitments}%`,
        })
      }
    }

    return violations
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateOverallRiskScore(metrics: Partial<PortfolioRiskMetrics>): number {
    const weights = {
      concentration: 0.35,
      liquidity: 0.25,
      currency: 0.15,
      diversification: 0.25,
    }

    let score = 0

    // Concentration risk (based on HHI)
    if (metrics.diversificationIndex !== undefined) {
      score += (metrics.diversificationIndex * 100) * weights.concentration
    }

    // Liquidity risk
    if (metrics.liquidityRatio !== undefined) {
      // Higher ratio = lower risk, invert it
      score += (1 - metrics.liquidityRatio) * 100 * weights.liquidity
    }

    // Currency risk
    if (metrics.currencyRiskScore !== undefined) {
      score += metrics.currencyRiskScore * weights.currency
    }

    // Diversification penalty
    if (metrics.diversificationIndex !== undefined) {
      score += (1 - metrics.diversificationIndex) * 100 * weights.diversification
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Main calculation method
   */
  async calculatePortfolioRisk(userId: string, clientId?: string): Promise<PortfolioRiskMetrics> {
    // Fetch policy
    const policy = await prisma.riskPolicy.findFirst({
      where: clientId ? { clientId } : { userId },
    })

    if (!policy) {
      throw new Error('No risk policy found')
    }

    // Fetch funds
    const funds = await prisma.fund.findMany({
      where: clientId ? { clientId } : { userId },
      select: {
        id: true,
        name: true,
        nav: true,
        commitment: true,
        paidIn: true,
        domicile: true,
        vintage: true,
        manager: true,
        sector: true,
        currency: true,
      },
    })

    // Calculate concentrations
    const concentrationByFund = this.calculateConcentration(funds, 'name', 'nav')
    const concentrationByGeography = this.calculateConcentration(funds, 'domicile', 'nav')
    const concentrationBySector = this.calculateConcentration(funds, 'sector', 'nav')
    const concentrationByVintage = this.calculateConcentration(funds, 'vintage', 'nav')

    // Calculate portfolio metrics
    const portfolioValue = funds.reduce((sum, f) => sum + f.nav, 0)
    const totalCommitment = funds.reduce((sum, f) => sum + f.commitment, 0)
    const totalPaidIn = funds.reduce((sum, f) => sum + f.paidIn, 0)
    const unfundedCommitments = totalCommitment - totalPaidIn

    // Calculate HHI (diversification index)
    const weights = funds.map((f) => f.nav / portfolioValue)
    const diversificationIndex = this.calculateHHI(weights)

    // Calculate liquidity ratio
    const liquidityRatio = portfolioValue / (portfolioValue + unfundedCommitments)

    // Calculate individual risk scores
    const concentrationRiskScore = diversificationIndex * 100
    const liquidityRiskScore = (1 - liquidityRatio) * 100

    // Currency risk (simplified: % of non-USD exposure)
    const nonUSDValue = funds
      .filter((f) => f.currency && f.currency !== 'USD')
      .reduce((sum, f) => sum + f.nav, 0)
    const currencyRiskScore = portfolioValue > 0 ? (nonUSDValue / portfolioValue) * 100 : 0

    // Build metrics object
    const metrics: Partial<PortfolioRiskMetrics> = {
      concentrationByFund,
      concentrationByGeography,
      concentrationBySector,
      concentrationByVintage,
      portfolioValue,
      unfundedCommitments,
      liquidityRatio,
      diversificationIndex,
      concentrationRiskScore,
      liquidityRiskScore,
      currencyRiskScore,
    }

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(metrics)

    // Check violations
    const violations = this.checkViolations(metrics, policy)

    return {
      ...metrics,
      overallRiskScore,
      violations,
    } as PortfolioRiskMetrics
  }

  /**
   * Stress Test Scenario
   */
  async runStressTest(
    userId: string,
    scenario: {
      marketShock: number // -30 means 30% decline
      sectorShocks?: Record<string, number>
      currencyShocks?: Record<string, number>
    }
  ): Promise<any> {
    const funds = await prisma.fund.findMany({
      where: { userId },
    })

    const results = funds.map((fund) => {
      let impactPct = scenario.marketShock

      // Apply sector-specific shocks
      if (scenario.sectorShocks && fund.sector && scenario.sectorShocks[fund.sector]) {
        impactPct += scenario.sectorShocks[fund.sector]
      }

      // Apply currency shocks
      if (scenario.currencyShocks && fund.currency && scenario.currencyShocks[fund.currency]) {
        impactPct += scenario.currencyShocks[fund.currency]
      }

      const originalNAV = fund.nav
      const newNAV = originalNAV * (1 + impactPct / 100)
      const dollarImpact = newNAV - originalNAV

      return {
        fundId: fund.id,
        fundName: fund.name,
        originalNAV,
        newNAV,
        dollarImpact,
        percentImpact: impactPct,
      }
    })

    const totalImpact = results.reduce((sum, r) => sum + r.dollarImpact, 0)
    const totalOriginalValue = funds.reduce((sum, f) => sum + f.nav, 0)
    const portfolioImpactPct = (totalImpact / totalOriginalValue) * 100

    return {
      scenario,
      results,
      totalImpact,
      portfolioImpactPct,
      affectedFunds: results.filter((r) => Math.abs(r.percentImpact) > 5).length,
    }
  }

  /**
   * Value at Risk (VaR) - Simplified Historical Method
   */
  async calculateVaR(userId: string, confidenceLevel: number = 0.95): Promise<number> {
    // This would require historical NAV data
    // For MVP, return a placeholder or use simplified calculation
    const currentMetrics = await this.calculatePortfolioRisk(userId)
    
    // Simplified: assume 2% daily volatility, scale to confidence level
    const dailyVolatility = 0.02
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326 // 95% or 99%
    
    return currentMetrics.portfolioValue * dailyVolatility * zScore
  }
}

export const riskCalculator = new RiskCalculator()
```

### **2.2 API Endpoints**

```typescript
// src/app/api/risk/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { riskCalculator } from '@/lib/risk-calculator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await riskCalculator.calculatePortfolioRisk(session.user.id)

    return NextResponse.json({ success: true, metrics })
  } catch (error) {
    console.error('Risk metrics error:', error)
    return NextResponse.json({ error: 'Failed to calculate risk metrics' }, { status: 500 })
  }
}
```

```typescript
// src/app/api/risk/stress-test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { riskCalculator } from '@/lib/risk-calculator'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, scenario } = await request.json()

    // Run stress test
    const results = await riskCalculator.runStressTest(session.user.id, scenario)

    // Save scenario
    const savedScenario = await prisma.scenarioAnalysis.create({
      data: {
        userId: session.user.id,
        name,
        description,
        scenarioType: 'STRESS_TEST',
        parameters: scenario,
        expectedImpact: results.totalImpact,
        portfolioValueChange: results.portfolioImpactPct,
        affectedFunds: results.results,
      },
    })

    return NextResponse.json({ success: true, results, scenarioId: savedScenario.id })
  } catch (error) {
    console.error('Stress test error:', error)
    return NextResponse.json({ error: 'Failed to run stress test' }, { status: 500 })
  }
}
```

---

## 🎨 Phase 3: Frontend Components

### **3.1 Risk Dashboard Page**

```typescript
// src/app/risk/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { RiskDashboardClient } from './RiskDashboardClient'

export const metadata = {
  title: 'Risk Management | OneLPM',
  description: 'Portfolio risk analysis and management',
}

export default async function RiskDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  return <RiskDashboardClient />
}
```

### **3.2 Main Dashboard Component**

```typescript
// src/app/risk/RiskDashboardClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  Activity,
  PieChart,
  Zap,
} from 'lucide-react'
import { RiskScoreGauge } from '@/components/Risk/RiskScoreGauge'
import { ConcentrationHeatmap } from '@/components/Risk/ConcentrationHeatmap'
import { ViolationsAlert } from '@/components/Risk/ViolationsAlert'
import { LiquidityTimeline } from '@/components/Risk/LiquidityTimeline'
import { StressTestPanel } from '@/components/Risk/StressTestPanel'

export function RiskDashboardClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [riskMetrics, setRiskMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRiskMetrics()
  }, [])

  const fetchRiskMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/risk/metrics')
      if (response.ok) {
        const data = await response.json()
        setRiskMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch risk metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-background">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Risk Management
                </h1>
                <p className="text-sm text-foreground/60 mt-0.5">
                  Portfolio risk analysis and monitoring
                </p>
              </div>
            </div>
          </motion.div>

          {/* Violations Alert */}
          {riskMetrics?.violations && riskMetrics.violations.length > 0 && (
            <ViolationsAlert violations={riskMetrics.violations} />
          )}

          {/* Risk Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <RiskScoreCard
              title="Overall Risk"
              score={riskMetrics?.overallRiskScore || 0}
              icon={Shield}
              color="orange"
            />
            <RiskScoreCard
              title="Concentration Risk"
              score={riskMetrics?.concentrationRiskScore || 0}
              icon={PieChart}
              color="red"
            />
            <RiskScoreCard
              title="Liquidity Risk"
              score={riskMetrics?.liquidityRiskScore || 0}
              icon={TrendingDown}
              color="blue"
            />
            <RiskScoreCard
              title="Currency Risk"
              score={riskMetrics?.currencyRiskScore || 0}
              icon={Activity}
              color="purple"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Concentration Heatmap */}
            <ConcentrationHeatmap data={riskMetrics?.concentrationBySector} />

            {/* Diversification Gauge */}
            <RiskScoreGauge
              score={riskMetrics?.diversificationIndex * 100}
              title="Diversification Score"
            />
          </div>

          {/* Liquidity Timeline */}
          <LiquidityTimeline
            unfundedCommitments={riskMetrics?.unfundedCommitments}
            portfolioValue={riskMetrics?.portfolioValue}
          />

          {/* Stress Testing */}
          <StressTestPanel />
        </main>
      </div>
    </div>
  )
}

interface RiskScoreCardProps {
  title: string
  score: number
  icon: any
  color: string
}

function RiskScoreCard({ title, score, icon: Icon, color }: RiskScoreCardProps) {
  const colorMap: Record<string, string> = {
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200/60 text-orange-700',
    red: 'from-red-500/10 to-red-600/5 border-red-200/60 text-red-700',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/60 text-blue-700',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/60 text-purple-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${colorMap[color]} dark:from-${color}-500/20 dark:to-${color}-600/10 rounded-xl border dark:border-${color}-800/60 p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
          {title}
        </div>
      </div>
      <div className={`text-2xl font-bold ${colorMap[color]}`}>
        {score.toFixed(1)}
      </div>
      <div className="text-xs text-foreground/60 mt-1">
        {score < 30 ? 'Low' : score < 60 ? 'Medium' : 'High'} Risk
      </div>
    </motion.div>
  )
}
```

### **3.3 Visualization Components**

I'll create the key visualization components in the next steps:
- `ConcentrationHeatmap` - Heat map for sector/geography exposure
- `RiskScoreGauge` - Circular gauge for risk scores
- `ViolationsAlert` - Alert banner for policy violations
- `LiquidityTimeline` - Timeline of unfunded commitments
- `StressTestPanel` - Interactive stress testing tool

---

## 📦 Phase 4: Component Library

Would you like me to continue with:
1. **Full component implementations** (heatmaps, gauges, charts)
2. **Stress testing interface** (scenario builder)
3. **Correlation matrix** (fund relationships)
4. **VaR calculator UI**
5. **Risk reports** (PDF generation)

Or would you prefer to focus on a specific aspect first?

---

## 🎯 Implementation Roadmap

### **Week 1: Foundation**
- ✅ Day 1-2: Database schema and migrations
- ✅ Day 3-4: Risk calculation engine
- ✅ Day 5: API endpoints

### **Week 2: Core Features**
- Day 6-7: Concentration analysis
- Day 8-9: Liquidity tracking
- Day 10: Stress testing

### **Week 3: Polish & Advanced**
- Day 11-12: Visualizations (heatmaps, gauges)
- Day 13-14: VaR calculations
- Day 15: Reports and exports

---

## 💡 Key Decisions Needed

1. **VaR Methodology**: Historical, Parametric, or Monte Carlo?
2. **Data Frequency**: Daily snapshots or on-demand calculation?
3. **Alert System**: Email notifications for violations?
4. **Benchmark Data**: External market data integration?
5. **Correlation Analysis**: Require historical performance data?

Let me know which direction you'd like to go, and I'll provide detailed implementation for that specific area!


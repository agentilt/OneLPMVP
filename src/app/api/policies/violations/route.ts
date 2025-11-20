import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Violation {
  type: string
  category: string
  severity: 'high' | 'medium' | 'low'
  current: number
  limit: number
  message: string
}

// GET /api/policies/violations - Check current portfolio against policy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's policy
    const policy = await prisma.riskPolicy.findUnique({
      where: { userId: session.user.id },
    })

    if (!policy) {
      return NextResponse.json({ violations: [], message: 'No policy set' })
    }

    // Get user's portfolio data
    const funds = await prisma.fund.findMany({
      where: { userId: session.user.id },
    })

    const directInvestments = await prisma.directInvestment.findMany({
      where: { userId: session.user.id },
    })

    const violations: Violation[] = []

    // Calculate portfolio totals
    const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
    const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
    const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
    const unfundedCommitments = totalCommitment - totalPaidIn

    // Check concentration limits

    // 1. Single Fund Exposure
    funds.forEach((fund) => {
      const exposure = (fund.nav / totalNav) * 100
      if (exposure > policy.maxSingleFundExposure) {
        violations.push({
          type: 'concentration',
          category: 'Single Fund',
          severity: exposure > policy.maxSingleFundExposure * 1.2 ? 'high' : 'medium',
          current: exposure,
          limit: policy.maxSingleFundExposure,
          message: `${fund.name} represents ${exposure.toFixed(1)}% of portfolio (limit: ${policy.maxSingleFundExposure}%)`,
        })
      }
    })

    // 2. Geography Exposure
    const geographyExposure: Record<string, number> = {}
    funds.forEach((fund) => {
      const geo = fund.domicile || 'Unknown'
      geographyExposure[geo] = (geographyExposure[geo] || 0) + fund.nav
    })

    Object.entries(geographyExposure).forEach(([geo, value]) => {
      const exposure = (value / totalNav) * 100
      if (exposure > policy.maxGeographyExposure) {
        violations.push({
          type: 'concentration',
          category: 'Geography',
          severity: exposure > policy.maxGeographyExposure * 1.2 ? 'high' : 'medium',
          current: exposure,
          limit: policy.maxGeographyExposure,
          message: `${geo} exposure is ${exposure.toFixed(1)}% (limit: ${policy.maxGeographyExposure}%)`,
        })
      }
    })

    // 3. Manager Exposure
    const managerExposure: Record<string, number> = {}
    funds.forEach((fund) => {
      const manager = fund.manager || 'Unknown'
      managerExposure[manager] = (managerExposure[manager] || 0) + fund.nav
    })

    Object.entries(managerExposure).forEach(([manager, value]) => {
      const exposure = (value / totalNav) * 100
      if (exposure > policy.maxManagerExposure) {
        violations.push({
          type: 'concentration',
          category: 'Manager',
          severity: exposure > policy.maxManagerExposure * 1.2 ? 'high' : 'medium',
          current: exposure,
          limit: policy.maxManagerExposure,
          message: `${manager} exposure is ${exposure.toFixed(1)}% (limit: ${policy.maxManagerExposure}%)`,
        })
      }
    })

    // 4. Vintage Exposure
    const vintageExposure: Record<number, number> = {}
    funds.forEach((fund) => {
      const vintage = fund.vintage || 0
      vintageExposure[vintage] = (vintageExposure[vintage] || 0) + fund.nav
    })

    Object.entries(vintageExposure).forEach(([vintage, value]) => {
      const exposure = (value / totalNav) * 100
      if (exposure > policy.maxVintageExposure) {
        violations.push({
          type: 'concentration',
          category: 'Vintage',
          severity: exposure > policy.maxVintageExposure * 1.2 ? 'high' : 'medium',
          current: exposure,
          limit: policy.maxVintageExposure,
          message: `Vintage ${vintage} exposure is ${exposure.toFixed(1)}% (limit: ${policy.maxVintageExposure}%)`,
        })
      }
    })

    // 5. Liquidity Constraints
    const unfundedPercentage = totalCommitment > 0 ? (unfundedCommitments / totalCommitment) * 100 : 0
    if (unfundedPercentage > policy.maxUnfundedCommitments) {
      violations.push({
        type: 'liquidity',
        category: 'Unfunded Commitments',
        severity: unfundedPercentage > policy.maxUnfundedCommitments * 1.2 ? 'high' : 'medium',
        current: unfundedPercentage,
        limit: policy.maxUnfundedCommitments,
        message: `Unfunded commitments are ${unfundedPercentage.toFixed(1)}% (limit: ${policy.maxUnfundedCommitments}%)`,
      })
    }

    // 6. Diversification
    if (funds.length < policy.minNumberOfFunds) {
      violations.push({
        type: 'diversification',
        category: 'Number of Funds',
        severity: funds.length < policy.minNumberOfFunds * 0.7 ? 'high' : 'medium',
        current: funds.length,
        limit: policy.minNumberOfFunds,
        message: `Portfolio has ${funds.length} funds (minimum: ${policy.minNumberOfFunds})`,
      })
    }

    // 7. Performance Thresholds
    const portfolioTVPI = totalPaidIn > 0 ? (totalNav + funds.reduce((sum, f) => sum + f.dpi * f.paidIn, 0)) / totalPaidIn : 0
    if (portfolioTVPI < policy.minAcceptableTVPI) {
      violations.push({
        type: 'performance',
        category: 'TVPI',
        severity: portfolioTVPI < policy.minAcceptableTVPI * 0.8 ? 'high' : 'medium',
        current: portfolioTVPI,
        limit: policy.minAcceptableTVPI,
        message: `Portfolio TVPI is ${portfolioTVPI.toFixed(2)}x (minimum: ${policy.minAcceptableTVPI.toFixed(2)}x)`,
      })
    }

    return NextResponse.json({
      violations,
      summary: {
        total: violations.length,
        high: violations.filter((v) => v.severity === 'high').length,
        medium: violations.filter((v) => v.severity === 'medium').length,
        low: violations.filter((v) => v.severity === 'low').length,
      },
    })
  } catch (error) {
    console.error('Error checking violations:', error)
    return NextResponse.json({ error: 'Failed to check violations' }, { status: 500 })
  }
}


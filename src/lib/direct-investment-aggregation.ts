import { prisma } from './db'

/**
 * Aggregates metrics and executive summary from documents to the DirectInvestment
 * This function should be called whenever a document is created, updated, or deleted
 */
export async function aggregateDirectInvestmentMetrics(directInvestmentId: string) {
  try {
    // Get all documents for this investment, ordered by uploadDate (most recent first)
    const documents = await prisma.directInvestmentDocument.findMany({
      where: { directInvestmentId },
      orderBy: { uploadDate: 'desc' },
    })

    if (documents.length === 0) {
      // No documents - clear aggregated fields
      await prisma.directInvestment.update({
        where: { id: directInvestmentId },
        data: {
          revenue: null,
          arr: null,
          mrr: null,
          grossMargin: null,
          runRate: null,
          burn: null,
          runway: null,
          headcount: null,
          cac: null,
          ltv: null,
          nrr: null,
          cashBalance: null,
          period: null,
          periodDate: null,
          highlights: null,
          lowlights: null,
          milestones: null,
          recentRounds: null,
          capTableChanges: null,
          lastReportDate: null,
        },
      })
      return
    }

    // Get the most recent document (first in the sorted array)
    const latestDocument = documents[0]

    // Aggregate metrics - use the latest document's values
    // For metrics that might need aggregation (like totals), use latest value
    // Users can query documents for historical tracking
    const aggregatedData: {
      revenue?: number | null
      arr?: number | null
      mrr?: number | null
      grossMargin?: number | null
      runRate?: number | null
      burn?: number | null
      runway?: number | null
      headcount?: number | null
      cac?: number | null
      ltv?: number | null
      nrr?: number | null
      cashBalance?: number | null
      period?: string | null
      periodDate?: Date | null
      highlights?: string | null
      lowlights?: string | null
      milestones?: string | null
      recentRounds?: string | null
      capTableChanges?: string | null
      lastReportDate?: Date | null
    } = {
      revenue: latestDocument.revenue ?? null,
      arr: latestDocument.arr ?? null,
      mrr: latestDocument.mrr ?? null,
      grossMargin: latestDocument.grossMargin ?? null,
      runRate: latestDocument.runRate ?? null,
      burn: latestDocument.burn ?? null,
      runway: latestDocument.runway ?? null,
      headcount: latestDocument.headcount ?? null,
      cac: latestDocument.cac ?? null,
      ltv: latestDocument.ltv ?? null,
      nrr: latestDocument.nrr ?? null,
      cashBalance: latestDocument.cashBalance ?? null,
      period: latestDocument.period ?? null,
      periodDate: latestDocument.periodDate ?? null,
      highlights: latestDocument.highlights ?? null,
      lowlights: latestDocument.lowlights ?? null,
      milestones: latestDocument.milestones ?? null,
      recentRounds: latestDocument.recentRounds ?? null,
      capTableChanges: latestDocument.capTableChanges ?? null,
      lastReportDate: latestDocument.uploadDate ?? null,
    }

    // Update the direct investment with aggregated values
    await prisma.directInvestment.update({
      where: { id: directInvestmentId },
      data: aggregatedData,
    })

    console.log(`[Aggregation] Updated metrics for direct investment ${directInvestmentId} from ${documents.length} documents`)
  } catch (error) {
    console.error(`[Aggregation] Error aggregating metrics for direct investment ${directInvestmentId}:`, error)
    throw error
  }
}

/**
 * Get historical metrics for a direct investment
 * Returns metrics over time from documents
 */
export async function getHistoricalMetrics(directInvestmentId: string) {
  const documents = await prisma.directInvestmentDocument.findMany({
    where: { directInvestmentId },
    select: {
      id: true,
      title: true,
      uploadDate: true,
      period: true,
      periodDate: true,
      revenue: true,
      arr: true,
      mrr: true,
      grossMargin: true,
      runRate: true,
      burn: true,
      runway: true,
      headcount: true,
      cac: true,
      ltv: true,
      nrr: true,
      cashBalance: true,
    },
    orderBy: { uploadDate: 'asc' },
  })

  return documents.map((doc) => ({
    date: doc.uploadDate,
    periodDate: doc.periodDate,
    period: doc.period,
    documentTitle: doc.title,
    documentId: doc.id,
    metrics: {
      revenue: doc.revenue,
      arr: doc.arr,
      mrr: doc.mrr,
      grossMargin: doc.grossMargin,
      runRate: doc.runRate,
      burn: doc.burn,
      runway: doc.runway,
      headcount: doc.headcount,
      cac: doc.cac,
      ltv: doc.ltv,
      nrr: doc.nrr,
      cashBalance: doc.cashBalance,
    },
  }))
}


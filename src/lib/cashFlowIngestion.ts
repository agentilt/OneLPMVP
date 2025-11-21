import { PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'

type RawCashFlowEvent = {
  type?: string
  kind?: string
  date?: string | Date
  dueDate?: string | Date
  uploadDate?: string | Date
  title?: string
  label?: string
  description?: string
  status?: string
  paymentStatus?: string
  amount?: number | string
  callAmount?: number | string
  distributionType?: string
  url?: string
}

type RawNavEntry = {
  date?: string | Date
  asOf?: string | Date
  periodEnd?: string | Date
  nav?: number | string
  value?: number | string
}

const PAYMENT_STATUS_VALUES = new Set(Object.values(PaymentStatus))

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = Number(value.replace(/,/g, ''))
    return isFinite(cleaned) ? cleaned : null
  }
  return null
}

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date && !isNaN(value.getTime())) return value
  const parsed = new Date(value as any)
  return isNaN(parsed.getTime()) ? null : parsed
}

const normalizePaymentStatus = (value: unknown): PaymentStatus => {
  if (typeof value === 'string') {
    const upper = value.toUpperCase()
    if (PAYMENT_STATUS_VALUES.has(upper as PaymentStatus)) {
      return upper as PaymentStatus
    }
  }
  return PaymentStatus.PENDING
}

const normalizeEventType = (value: unknown): 'CAPITAL_CALL' | 'DISTRIBUTION' | null => {
  if (typeof value !== 'string') return null
  const upper = value.toUpperCase()
  if (upper === 'CAPITAL_CALL') return 'CAPITAL_CALL'
  if (upper === 'DISTRIBUTION') return 'DISTRIBUTION'
  return null
}

const ensureCapitalCallDocument = async (fundId: string, payload: RawCashFlowEvent) => {
  const rawAmount = parseNumber(payload.amount ?? payload.callAmount)
  const amount = rawAmount !== null ? Math.abs(rawAmount) : null
  if (!amount || amount <= 0) return

  const dueDate = parseDateValue(payload.dueDate ?? payload.date)
  const uploadDate = parseDateValue(payload.uploadDate ?? payload.date) ?? new Date()
  const title =
    payload.title ||
    payload.label ||
    `Capital Call ${dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}`

  const whereClause: any = { fundId, type: 'CAPITAL_CALL', callAmount: amount }
  if (dueDate) {
    whereClause.dueDate = dueDate
  }
  if (title) {
    whereClause.title = title
  }

  const existing = await prisma.document.findFirst({ where: whereClause })

  if (existing) return

  await prisma.document.create({
    data: {
      fundId,
      type: 'CAPITAL_CALL',
      title,
      uploadDate,
      dueDate,
      callAmount: amount,
      paymentStatus: normalizePaymentStatus(payload.paymentStatus ?? payload.status),
      url: payload.url || '/auto-ingested',
      parsedData: null,
    },
  })
}

const ensureDistribution = async (fundId: string, payload: RawCashFlowEvent) => {
  const amountRaw = parseNumber(payload.amount)
  const amount = amountRaw !== null ? Math.abs(amountRaw) : null
  if (!amount || amount === 0) return
  const date = parseDateValue(payload.date ?? (payload as any).distributionDate)
  if (!date) return

  const distributionType =
    typeof payload.distributionType === 'string' && payload.distributionType.trim().length > 0
      ? payload.distributionType
      : 'CASH'

  const existing = await prisma.distribution.findFirst({
    where: {
      fundId,
      distributionDate: date,
      amount,
    },
  })

  if (existing) return

  await prisma.distribution.create({
    data: {
      fundId,
      distributionDate: date,
      amount,
      distributionType,
      description: payload.description ?? payload.title ?? payload.label ?? 'Distribution',
      taxYear: date.getFullYear(),
      k1Status: 'ISSUED',
    },
  })
}

const ensureNavEntry = async (fundId: string, payload: RawNavEntry) => {
  const nav = parseNumber(payload.nav ?? payload.value)
  if (nav === null) return
  const date = parseDateValue(payload.date ?? payload.periodEnd ?? payload.asOf)
  if (!date) return

  const existing = await prisma.navHistory.findFirst({
    where: {
      fundId,
      date,
    },
  })

  if (existing) {
    await prisma.navHistory.update({
      where: { id: existing.id },
      data: { nav },
    })
    return
  }

  await prisma.navHistory.create({
    data: {
      fundId,
      date,
      nav,
    },
  })
}

export async function ingestCashFlowDataFromParsedData(fundId: string, parsedData: any) {
  if (!parsedData) return

  let normalizedData = parsedData
  if (typeof normalizedData === 'string') {
    try {
      normalizedData = JSON.parse(normalizedData)
    } catch {
      return
    }
  }

  if (typeof normalizedData !== 'object') return

  const cashFlows = Array.isArray(normalizedData.cashFlows) ? normalizedData.cashFlows : []
  const capitalCalls = [
    ...(Array.isArray(normalizedData.capitalCalls) ? normalizedData.capitalCalls : []),
    ...cashFlows.filter((event) => normalizeEventType(event.type ?? event.kind) === 'CAPITAL_CALL'),
  ]

  const distributions = [
    ...(Array.isArray(normalizedData.distributions) ? normalizedData.distributions : []),
    ...cashFlows.filter((event) => normalizeEventType(event.type ?? event.kind) === 'DISTRIBUTION'),
  ]

  const navEntries = Array.isArray(normalizedData.navHistory)
    ? normalizedData.navHistory
    : Array.isArray(normalizedData.navUpdates)
    ? normalizedData.navUpdates
    : []

  for (const call of capitalCalls) {
    await ensureCapitalCallDocument(fundId, call)
  }

  for (const distribution of distributions) {
    await ensureDistribution(fundId, distribution)
  }

  for (const navEntry of navEntries) {
    await ensureNavEntry(fundId, navEntry)
  }
}

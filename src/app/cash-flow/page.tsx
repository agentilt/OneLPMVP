import { Metadata } from 'next'
import { CashFlowClient } from './CashFlowClient'

export const metadata: Metadata = {
  title: 'Cash Flow Analysis | OneLPM',
  description: 'Track capital calls, distributions, and investment flows across your portfolio',
}

export default function CashFlowPage() {
  return <CashFlowClient />
}


const FUND_ASSET_CLASS_KEYWORDS = [
  { label: 'Venture Capital', keywords: ['venture', 'tech', 'innovation', 'startup'] },
  { label: 'Growth Equity', keywords: ['growth', 'expansion', 'scale'] },
  { label: 'Private Credit', keywords: ['credit', 'debt', 'mezzanine', 'direct lending'] },
  { label: 'Infrastructure', keywords: ['infrastructure', 'transport', 'energy', 'renewable'] },
  { label: 'Real Estate', keywords: ['real estate', 'property', 'urban', 'residential', 'logistics'] },
  { label: 'Buyout', keywords: ['buyout', 'capital partners', 'equity partners'] },
  { label: 'Multi-Strategy', keywords: [] },
]

export const inferFundAssetClass = (fund: { name?: string | null; manager?: string | null }) => {
  const source = `${fund?.name || ''} ${fund?.manager || ''}`.toLowerCase()
  for (const entry of FUND_ASSET_CLASS_KEYWORDS) {
    if (entry.keywords.some((keyword) => source.includes(keyword))) {
      return entry.label
    }
  }
  return 'Multi-Strategy'
}

export const mapInvestmentTypeToAssetClass = (type?: string | null) => {
  switch (type) {
    case 'PRIVATE_EQUITY':
      return 'Private Equity'
    case 'PRIVATE_DEBT':
    case 'PRIVATE_CREDIT':
      return 'Private Credit'
    case 'PUBLIC_EQUITY':
      return 'Public Equity'
    case 'REAL_ESTATE':
      return 'Real Estate'
    case 'REAL_ASSETS':
      return 'Real Assets'
    case 'CASH':
      return 'Cash & Equivalents'
    default:
      return 'Direct Investments'
  }
}

# Financial Calculations Audit - Issues Found

## 🚨 CRITICAL ISSUES IDENTIFIED

### Issue #1: **INCORRECT TVPI Calculation** ⚠️

**Current Implementation (WRONG):**
```typescript
// In FundsTable.tsx, FundsClient.tsx, FundDetailClient.tsx
const calculateTvpi = (nav: number, paidIn: number, dpi: number) => {
  return paidIn > 0 ? (nav / paidIn) + dpi : 0
}
```

**Why This is WRONG:**
This formula is **double-counting** distributions!

**Industry Standard Formula:**
```
TVPI (Total Value to Paid-In) = (Residual Value + Distributions) / Paid-In Capital

Where:
- Residual Value = Current NAV
- Distributions = Total cash returned to investors
- Paid-In Capital = Total capital called from investors

Therefore:
TVPI = (NAV + Distributions) / Paid-In

Or, since DPI = Distributions / Paid-In:
TVPI = (NAV / Paid-In) + DPI

Which can also be expressed as:
TVPI = RVPI + DPI

Where RVPI (Residual Value to Paid-In) = NAV / Paid-In
```

**The Error:**
The current code does: `(nav / paidIn) + dpi`

But if `dpi` is already stored as a **multiple** (e.g., 0.5x), then this is correct!
However, if `dpi` is stored as the **actual distribution amount**, then we need: `(nav + dpi) / paidIn`

**Need to verify:** How is DPI stored in the database?

---

### Issue #2: **Portfolio-Level TVPI Averaging is INCORRECT** ⚠️

**Current Implementation (WRONG):**
```typescript
// In FundsClient.tsx
const calculatedTvpis = funds.map(fund => calculateTvpi(fund.nav, fund.paidIn, fund.dpi))
const avgTvpi = calculatedTvpis.length > 0 
  ? calculatedTvpis.reduce((sum, tvpi) => sum + tvpi, 0) / calculatedTvpis.length 
  : 0
```

**Why This is WRONG:**
You **CANNOT** simply average TVPIs across funds! This gives equal weight to a $1M fund and a $100M fund.

**Industry Standard:**
Portfolio TVPI must be **weighted by paid-in capital** or calculated from portfolio totals:

```typescript
// CORRECT Method 1: Calculate from totals
const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0

// CORRECT Method 2: Weighted average
const portfolioTvpi = funds.reduce((sum, fund) => {
  const fundTvpi = calculateTvpi(fund.nav, fund.paidIn, fund.dpi)
  const weight = fund.paidIn / totalPaidIn
  return sum + (fundTvpi * weight)
}, 0)
```

**Good News:** The dashboard (page.tsx line 82) IS doing this correctly!

---

### Issue #3: **DPI Averaging is INCORRECT** ⚠️

**Current Implementation (WRONG):**
```typescript
const avgDpi = funds.length > 0 
  ? funds.reduce((sum, fund) => sum + fund.dpi, 0) / funds.length 
  : 0
```

**Why This is WRONG:**
Same issue - simple averaging doesn't account for fund sizes.

**Industry Standard:**
```typescript
// CORRECT: Weighted by paid-in capital
const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
const portfolioDpi = totalPaidIn > 0 ? totalDistributions / totalPaidIn : 0
```

---

### Issue #4: **IRR Calculation is MISSING** ⚠️

**Current State:** IRR is stored in the database but never calculated by the application.

**Industry Standard:** IRR (Internal Rate of Return) requires:
1. Initial investment (capital calls with dates)
2. Interim cash flows (distributions with dates)
3. Current residual value (NAV)
4. Solving for the rate that makes NPV = 0

**Formula:**
```
0 = Σ (CF_t / (1 + IRR)^t)

Where:
- CF_t = Cash flow at time t (negative for capital calls, positive for distributions)
- t = Time period from fund inception
- Final CF includes current NAV as terminal value
```

**Recommendation:** IRR should be calculated server-side or imported from fund data, not calculated in the UI.

---

### Issue #5: **Direct Investment Valuation is QUESTIONABLE** ⚠️

**Current Implementation:**
```typescript
// In dashboard/page.tsx
const totalDirectInvestmentValue = directInvestments.reduce(
  (sum, inv) => sum + (inv.cashBalance || inv.revenue || 0),
  0
)
```

**Issues:**
1. `cashBalance || revenue` - These are completely different metrics
2. Revenue is **NOT** valuation
3. Missing `currentValue` field which should be the actual valuation

**Industry Standard:**
```typescript
const totalDirectInvestmentValue = directInvestments.reduce(
  (sum, inv) => sum + (inv.currentValue || inv.investmentAmount || 0),
  0
)
```

Use `currentValue` (mark-to-market), fallback to `investmentAmount` (cost basis) if no valuation available.

---

### Issue #6: **Combined Portfolio Metrics are MIXING APPLES AND ORANGES** ⚠️

**Current Implementation:**
```typescript
const combinedCommitment = totalCommitment + totalDirectInvestmentAmount
const combinedNav = totalNav + totalDirectInvestmentValue
const combinedPaidIn = totalPaidIn + totalDirectInvestmentAmount
```

**Issues:**
1. Direct investments don't have "commitments" - they're typically fully funded
2. Mixing fund accounting (commitment/paid-in) with direct investment accounting (cost/value)
3. Combined TVPI calculation will be misleading

**Industry Standard:**
Keep fund and direct investment metrics **SEPARATE** or clearly label as "Total Portfolio Value" without trying to calculate TVPI across both.

```typescript
// CORRECT: Separate reporting
const fundPortfolioValue = totalNav + totalDistributions
const directInvestmentValue = totalDirectInvestmentValue
const totalPortfolioValue = fundPortfolioValue + directInvestmentValue

// Fund-only metrics
const fundTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0

// Direct investment ROI (if applicable)
const diTotalInvested = directInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0)
const diMoic = diTotalInvested > 0 ? totalDirectInvestmentValue / diTotalInvested : 0
```

---

### Issue #7: **RVPI is NOT CALCULATED** ⚠️

**Industry Standard:** RVPI (Residual Value to Paid-In) is a key metric:

```
RVPI = NAV / Paid-In Capital

This represents the unrealized value still in the fund.
```

**Should be displayed alongside TVPI and DPI:**
```
TVPI = RVPI + DPI
```

---

### Issue #8: **Cash Flow Calculations in Forecasting May Be Incorrect**

Need to verify the J-curve and deployment pace calculations in `ForecastingClient.tsx`.

---

## 📊 Industry Standard Formulas - Quick Reference

### Core Metrics

**1. TVPI (Total Value to Paid-In Multiple)**
```
TVPI = (Current NAV + Cumulative Distributions) / Paid-In Capital
TVPI = RVPI + DPI
```

**2. DPI (Distributions to Paid-In Multiple)**
```
DPI = Cumulative Distributions / Paid-In Capital
```

**3. RVPI (Residual Value to Paid-In Multiple)**
```
RVPI = Current NAV / Paid-In Capital
```

**4. IRR (Internal Rate of Return)**
```
0 = Σ (CF_t / (1 + IRR)^t)
Requires solving iteratively (Newton-Raphson or similar)
```

**5. MOIC (Multiple on Invested Capital)**
```
MOIC = (Current Value + Realized Proceeds) / Total Investment
Similar to TVPI but used for direct investments
```

### Portfolio-Level Calculations

**Portfolio TVPI:**
```typescript
const totalNav = Σ fund.nav
const totalPaidIn = Σ fund.paidIn
const totalDistributions = Σ (fund.dpi * fund.paidIn)
const portfolioTvpi = (totalNav + totalDistributions) / totalPaidIn
```

**Portfolio IRR:**
```
Aggregate all cash flows across all funds with dates
Solve for rate that makes NPV = 0
```

---

## 🔧 FIXES REQUIRED

### Priority 1: Critical Fixes
1. ✅ Verify how DPI is stored (multiple vs. amount)
2. ❌ Fix portfolio TVPI calculation in FundsClient.tsx (use weighted or total method)
3. ❌ Fix portfolio DPI calculation in FundsClient.tsx (use weighted or total method)
4. ❌ Add RVPI calculation everywhere TVPI/DPI are shown
5. ❌ Fix direct investment valuation to use currentValue

### Priority 2: Important Improvements
6. ❌ Separate fund and direct investment metrics clearly
7. ❌ Add portfolio-level metric validation
8. ❌ Add metric calculation documentation

### Priority 3: Nice to Have
9. ❌ Implement IRR calculation (or clearly mark as "imported from fund data")
10. ❌ Add metric tooltips explaining calculations
11. ❌ Add data validation warnings

---

## 📝 Verification Checklist

Before deploying fixes:
- [ ] Verify DPI storage format in database
- [ ] Test TVPI calculation with sample data
- [ ] Test portfolio aggregation with multiple funds
- [ ] Verify all metrics add up: TVPI = RVPI + DPI
- [ ] Test edge cases (zero paid-in, negative returns, etc.)
- [ ] Update all charts and visualizations
- [ ] Update export functionality
- [ ] Update documentation

---

## 🎯 Test Cases

### Test Case 1: Single Fund
```
Fund A:
- Commitment: $10M
- Paid-In: $8M
- NAV: $6M
- Cumulative Distributions: $4M

Expected:
- RVPI = $6M / $8M = 0.75x
- DPI = $4M / $8M = 0.50x
- TVPI = 0.75x + 0.50x = 1.25x
- OR TVPI = ($6M + $4M) / $8M = 1.25x ✓
```

### Test Case 2: Multi-Fund Portfolio
```
Fund A:
- Paid-In: $10M, NAV: $15M, Distributions: $2M
- TVPI = ($15M + $2M) / $10M = 1.70x

Fund B:
- Paid-In: $5M, NAV: $4M, Distributions: $1M
- TVPI = ($4M + $1M) / $5M = 1.00x

Portfolio:
- Total Paid-In: $15M
- Total NAV: $19M
- Total Distributions: $3M
- Portfolio TVPI = ($19M + $3M) / $15M = 1.47x

WRONG: (1.70x + 1.00x) / 2 = 1.35x ❌
RIGHT: Weighted or total method = 1.47x ✓
```

---

**Next Steps:** Apply fixes systematically across all files.


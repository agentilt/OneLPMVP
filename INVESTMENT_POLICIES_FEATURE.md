# Investment Policies Feature

## Overview

The Investment Policies feature allows Limited Partners (LPs) to define, monitor, and enforce their investment policies directly within the OneLPMVP platform. This feature helps LPs maintain portfolio compliance, manage risk exposure, and receive alerts when policy violations occur.

## Features Implemented

### 1. **Risk Policy Management**

#### Database Schema
- **New Model**: `RiskPolicy`
  - One-to-one relationship with `User`
  - Comprehensive policy parameters with sensible defaults
  - Automatic timestamps for audit trail

#### Policy Parameters

**Concentration Limits** (as percentages):
- `maxSingleFundExposure` (default: 25%) - Maximum exposure to any single fund
- `maxGeographyExposure` (default: 40%) - Maximum exposure to any single geography
- `maxSectorExposure` (default: 35%) - Maximum exposure to any single sector
- `maxVintageExposure` (default: 30%) - Maximum exposure to any single vintage year
- `maxManagerExposure` (default: 20%) - Maximum exposure to any single manager

**Liquidity Constraints**:
- `maxUnfundedCommitments` (default: 50%) - Maximum unfunded commitments as % of total
- `minLiquidityReserve` (default: 10%) - Minimum cash reserve required

**Diversification Targets**:
- `minNumberOfFunds` (default: 5) - Minimum number of funds in portfolio
- `targetDiversificationScore` (default: 0.7) - Target diversification score (0-1 scale)

**Performance Thresholds**:
- `minAcceptableTVPI` (default: 1.5x) - Minimum acceptable Total Value to Paid-In
- `minAcceptableDPI` (default: 0.5x) - Minimum acceptable Distributions to Paid-In
- `minAcceptableIRR` (default: 10%) - Minimum acceptable Internal Rate of Return

**Other Limits**:
- `maxCurrencyExposure` (default: 30%) - Maximum exposure to any single currency
- `maxLeverageRatio` (default: 2.0x) - Maximum leverage multiple

**Alert Preferences**:
- `enablePolicyViolationAlerts` (default: true)
- `enablePerformanceAlerts` (default: true)
- `enableLiquidityAlerts` (default: true)

### 2. **API Endpoints**

#### `/api/policies`

**GET** - Retrieve user's risk policy
- Returns existing policy or creates one with defaults
- Authentication required

**PUT** - Update user's risk policy
- Validates all inputs (percentages 0-100, positive numbers, etc.)
- Uses upsert to create or update policy
- Returns updated policy with success message

**DELETE** - Reset policy to defaults
- Removes custom policy (reverts to defaults on next GET)
- Authentication required

#### `/api/policies/violations`

**GET** - Check current portfolio against policy
- Calculates portfolio metrics
- Checks all policy constraints
- Returns violations with severity levels (high/medium/low)
- Provides detailed violation messages
- Includes summary statistics

**Violation Types Checked**:
1. Single Fund Concentration
2. Geography Concentration
3. Manager Concentration
4. Vintage Concentration
5. Unfunded Commitments
6. Minimum Number of Funds
7. Portfolio Performance (TVPI)

### 3. **User Interface**

#### Settings Page - Investment Policies Tab

**Location**: `/settings` → "Investment Policies" tab

**Sections**:

1. **Policy Violations Alert** (if violations exist)
   - Displays number of violations
   - Shows top 3 violations with severity badges
   - Color-coded by severity (red for high, amber for medium, blue for low)

2. **Concentration Limits**
   - Input fields for all concentration parameters
   - Real-time validation
   - Percentage suffix indicators

3. **Liquidity Constraints**
   - Unfunded commitments limit
   - Minimum liquidity reserve

4. **Diversification Targets**
   - Minimum number of funds
   - Target diversification score

5. **Performance Thresholds**
   - Minimum TVPI, DPI, and IRR thresholds
   - Multiplier/percentage indicators

6. **Alert Preferences**
   - Toggle switches for each alert type
   - Descriptive explanations

**Actions**:
- **Reset** button - Reverts to last saved state
- **Save Policy** button - Saves all changes

### 4. **Validation & Compliance**

#### Input Validation
- Percentages must be between 0-100
- Counts must be positive integers
- Ratios must be positive numbers
- Diversification score must be between 0-1

#### Real-time Compliance Checking
- Automatic calculation of current exposures
- Comparison against policy limits
- Severity classification based on breach magnitude:
  - **High**: >20% over limit
  - **Medium**: Within 20% over limit
  - **Low**: Minor breaches

#### Violation Detection
- Fund concentration by NAV
- Geography aggregation by domicile
- Manager aggregation by fund manager
- Vintage year aggregation
- Liquidity calculations
- Diversification checks
- Performance threshold monitoring

## Usage

### For Limited Partners

1. **Set Your Policy**:
   - Navigate to Settings → Investment Policies
   - Adjust parameters to match your investment policy
   - Enable/disable alert preferences
   - Click "Save Policy"

2. **Monitor Compliance**:
   - Violations are automatically calculated
   - Alert banner shows if violations exist
   - View detailed violation messages with severity

3. **Update Policy**:
   - Modify any parameters as needed
   - Changes take effect immediately upon save
   - Reset button restores last saved state

4. **Understand Violations**:
   - **High Severity**: Immediate attention required (>20% over limit)
   - **Medium Severity**: Should be addressed soon (within 20% over limit)
   - **Low Severity**: Monitor but not critical

### Integration Points

**Analytics Hub** (`/analytics`):
- Can display policy violation count in summary cards
- Quick link to settings for policy configuration

**Risk Management** (`/risk`):
- Uses policy limits for concentration analysis
- Displays violation details in context
- Provides recommendations for rebalancing

**Portfolio Builder** (`/portfolio-builder`):
- Checks proposed changes against policy
- What-if analysis includes policy compliance
- Rebalancing recommendations consider policy limits

## Technical Implementation

### Database Migration
```bash
npx prisma db push
```

### File Structure
```
src/
├── app/
│   ├── api/
│   │   └── policies/
│   │       ├── route.ts              # GET, PUT, DELETE policy
│   │       └── violations/
│   │           └── route.ts          # GET violations check
│   └── settings/
│       ├── page.tsx                  # Server component
│       └── SettingsClient.tsx        # Updated with policies tab
└── prisma/
    └── schema.prisma                 # Added RiskPolicy model
```

### Key Dependencies
- Next.js API Routes for backend
- Prisma for database ORM
- React state management for UI
- Server-side session authentication

## Future Enhancements

### Phase 2 Improvements
1. **Historical Tracking**
   - Store policy violation history
   - Track compliance trends over time
   - Generate compliance reports

2. **Email Alerts**
   - Send email notifications for violations
   - Configurable alert frequency
   - Digest reports (daily/weekly)

3. **Advanced Analytics**
   - Compliance dashboard
   - Violation trends over time
   - Predictive compliance forecasting

4. **Policy Templates**
   - Pre-defined policy templates by LP type
   - Industry standard benchmarks
   - Regulatory requirement presets

5. **Multi-Currency Support**
   - Currency exposure calculations
   - FX risk monitoring
   - Hedging recommendations

6. **Sector Classification**
   - Industry/sector tagging for funds
   - Sector concentration analysis
   - GICS or custom taxonomy support

## Testing

### Manual Testing Checklist
- [ ] Create new policy with custom values
- [ ] Update existing policy
- [ ] Reset policy to defaults
- [ ] Verify validation (negative numbers, out of range)
- [ ] Check violation detection with various portfolios
- [ ] Test alert toggles
- [ ] Verify mobile responsiveness
- [ ] Test dark mode compatibility

### API Testing
```bash
# Get policy
curl -X GET http://localhost:3000/api/policies \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Update policy
curl -X PUT http://localhost:3000/api/policies \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"maxSingleFundExposure": 30}'

# Check violations
curl -X GET http://localhost:3000/api/policies/violations \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

## Documentation Updates

This feature has been documented in:
- ✅ `INVESTMENT_POLICIES_FEATURE.md` (this file)
- ✅ Prisma schema comments
- ✅ API route comments
- ✅ UI component inline documentation

## Compliance & Security

- ✅ User-specific policies (no cross-user access)
- ✅ Session authentication required
- ✅ Input validation on server-side
- ✅ SQL injection protection via Prisma
- ✅ GDPR compliant (user owns their policy data)
- ✅ Audit trail via timestamps

## Support & Feedback

For questions or feature requests related to Investment Policies:
- Create an issue in the repository
- Contact the development team
- Refer to in-app help documentation

---

**Last Updated**: 2025-01-20  
**Version**: 1.0.0  
**Status**: ✅ Production Ready


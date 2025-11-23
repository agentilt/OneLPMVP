# OneLP Platform Overview and Technical Guide

## Part 1 — Investor Overview
- **What it is**: A secure, invitation-only Limited Partner portal that centralizes fund performance, documents, capital calls, distributions, direct investments, and risk/analytics in one view.
- **Who it serves**: Limited Partners who need timely portfolio visibility and compliance-safe document delivery; GPs/administrators who need controlled distribution of information; data managers who prepare data and documents without full admin rights.
- **Investor experience**
  - Single sign-on to a personalized dashboard with portfolio KPIs (commitment, NAV, TVPI, DPI), active capital calls, and recent distributions.
  - Drill into funds for NAV history, performance metrics, and document viewing (capital calls, quarterly/annual reports, compliance/KYC).
  - Direct investments tracked alongside fund holdings, including latest valuations and summary metrics.
  - Analytics, forecasting, and risk views summarize concentration, liquidity, and cash-flow projections across funds and directs.
- **Administrator/data manager controls**
  - Role-based access: Admins manage users, invitations, funds, and documents; Data Managers can curate data/documents without full admin rights; Users view only assigned funds/clients.
  - Invitation-only onboarding with expiry and one-time use tokens; fund access is assignable per user and per client.
  - Manual document ingestion with structured metadata (type, dates, amounts, payment status, parsed JSON) to support downstream analytics.
- **Trust and security**
  - Hardened authentication (rate-limited credential login, optional MFA, strong password policy, session max-age ~4 hours).
  - HTTPS enforcement with HSTS, CSP, and restrictive security headers; cookies secured for production domains.
  - Row-level access using `clientId` and fund-access mappings to ensure each LP only sees permitted holdings.
- **Commercial readiness**
  - Built on production-ready stack (Next.js 15, React 19, TypeScript, Prisma/Postgres) with seeded demo data for fast evaluations.
  - Clear roadmap hooks for S3-backed file storage, AI-driven document parsing, audit trails, export/notifications, and stronger MFA.

## Part 2 — Technical Brief for Engineers
- **Architecture at a glance**
  - Web: Next.js 15 App Router with React 19 and Tailwind; mix of Server Components for data fetching and Client Components for interactivity.
  - API: Next.js Route Handlers under `src/app/api/*` for auth, admin/data-manager workflows, documents, investments, analytics, risk, forecasting, and mobile/testing endpoints.
  - Data: Prisma ORM to PostgreSQL (`prisma/schema.prisma`); migrations in `migrations/` plus seed script `prisma/seed.ts`.
  - Auth: NextAuth credentials provider with bcrypt, JWT sessions, MFA hooks, and login rate limiting (`src/lib/auth.ts`).
  - UI/UX: Reusable layout components (`Topbar`, `Sidebar`, `AdminSidebar`, `DataManagerSidebar`), charts via Recharts, motion via Framer Motion, icons via Lucide, toasts via Sonner.

- **Roles and access control**
  - Roles: `USER`, `ADMIN`, `DATA_MANAGER` (see `Role` enum in schema).
  - Middleware (`src/middleware.ts`) guards authenticated routes, forces HTTPS in prod, injects security headers, and redirects roles: Admin-only for `/admin/*` (documents allow Admin or Data Manager); Data Manager routed to `/data-manager/*`; public access limited to `/`, `/login`, `/register`, password-reset, and `/legal/*`.
  - Tenancy: Users can be linked to a `clientId`; fund visibility is filtered by `clientId` or `FundAccess` mapping; admins bypass filters.

- **Key domain models (Prisma)**
  - `User`, `Invitation`, `Client`: Identity, onboarding, and client-level grouping.
  - `Fund`, `NavHistory`, `Distribution`, `Document`, `FundAccess`: Core fund data, NAV time series, distributions, documents (capital calls/reports/KYC/compliance), and per-user access.
  - `DirectInvestment` + `DirectInvestmentDocument`: Direct holdings with rich, asset-class-specific fields and historical document snapshots.
  - Risk/analytics: `RiskPolicy`, `RiskScenario`, `RiskSnapshot`, `PortfolioModel`, `SavedReport`, `SavedForecast`.
  - Operational logs: `AuditLog`, `SecurityEvent`, `ActivityEvent`, `UserSession`, `PasswordReset`, `MFAToken`, `MFASettings`.

- **Feature modules and flows (selected)**
  - **Authentication & onboarding**: Credentials login with bcrypt, lockout after repeated failures, MFA-ready path, JWT session max-age 4h/update-age 30m, secure cookie domains for `.onelp.capital`. Registration uses invitation tokens with expiry; password reset endpoints are available under `/api/auth/reset-password`.
  - **Investor portal** (`/dashboard`, `/funds/[id]`, `/direct-investments`, `/capital-calls`, `/compliance`, `/reports`): Server components pull scoped data via Prisma; documents and capital calls drive pending-call counts and KPIs.
  - **Analytics hub** (`/analytics`) and **risk** (`/risk`): Aggregate commitments/NAV/TVPI/DPI, cash-flow series, pending/forecasted capital calls, distributions, and concentration; risk scores computed via `src/lib/riskEngine.ts` with default policy/scenario configs.
  - **Forecasting** (`/forecasting`): Cash-flow scenarios using fund vintages, distributions, and capital-call documents; saved scenarios stored in `SavedForecast`.
  - **Admin & data manager** (`/admin/*`, `/data-manager/*`): Manage users/funds, send invitations, and upload documents. Data Managers have constrained navigation but can upload/view documents and users.
  - **Documents**: Manual metadata entry at `/admin/documents/upload`; persisted via `/api/admin/documents`; files referenced by URL today (placeholder path added if none is provided). `parsedData` JSON supports structured extraction for analytics. S3 or other storage can replace the URL field later.

- **Security posture**
  - Headers and transport: HSTS + HTTPS redirect (`next.config.js`, `src/middleware.ts`), CSP allowing only required domains (Crisp/Tawk chat), X-Frame-Options DENY, X-Content-Type-Options nosniff, XSS protection, referrer/permissions policies.
  - Auth hardening: Rate-limited login, password policy and strength scoring (`src/lib/password-validation.ts`), bcrypt hashing, session shortening, MFA scaffolding.
  - CORS: API responses allow `https://admin.onelp.capital` (see `next.config.js`); adjust if domains change.
  - Access enforcement: All sensitive routes behind `withAuth` middleware; role checks inside handlers and pages; client/fund scoping on queries.

- **APIs (high-level)**
  - Auth and identity: `/api/auth/[...nextauth]`, `/api/register`, `/api/invitations`, `/api/auth/reset-password`, `/api/session`.
  - Admin/data: `/api/admin/funds`, `/api/admin/funds/list`, `/api/admin/documents`, `/api/data-manager/*`, `/api/policies`, `/api/portfolio-models`.
  - Investments and documents: `/api/funds/*`, `/api/documents`, `/api/capital-calls`, `/api/direct-investments`, `/api/direct-investment-documents`.
  - Analytics/risk/forecasting: `/api/analytics`, `/api/risk`, `/api/forecasting`, `/api/reports`, `/api/search`.
  - Mobile/testing utilities live under `/api/mobile` and `/api/test-*` for integration validation.

- **Configuration and environment**
  - Required env vars (see `README.md`): `DATABASE_URL` (Postgres with `sslmode=require` in prod), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, SMTP settings (`SMTP_HOST/PORT/USER/PASSWORD/SMTP_FROM`), optional seed admin credentials (`ADMIN_EMAIL/ADMIN_PASSWORD`).
  - Domain settings: Secure cookies and redirects assume `.onelp.capital`; update `next.config.js` and middleware if deploying under a different domain.
  - Images: Allowed domains in `next.config.js` include `localhost`, `onelp.capital`, and the Vercel preview host.

- **Local development**
  - Install deps: `npm install`.
  - Database: `npm run db:generate` → `npm run db:push` → `npm run db:seed` to create schema and seed demo/admin users.
  - Run: `npm run dev` (app on http://localhost:3000). Inspect data with `npx prisma studio` if needed.
  - Lint: `npm run lint`. Build: `npm run build`.

- **Data and tenancy model**
  - LP scoping: `clientId` ties users/funds/direct investments to clients; `FundAccess` enables per-user overrides.
  - Documents and capital calls drive NAV history, cash-flow analytics, and pending-calls indicators; distributions recorded separately in `Distribution`.
  - Direct investments are asset-class aware (private equity/debt, public equity, real estate, real assets, cash) with per-class metrics and document histories.

- **Deployment notes**
  - Enforce HTTPS and security headers (already in code). Ensure reverse proxy sets `x-forwarded-proto=https`.
  - Set cookie domains and CORS origins to match the production hostname(s).
  - Use managed Postgres (Neon/Supabase/Railway/etc.) with SSL; run migrations or `db:push` + seed.
  - Document storage currently expects URLs; integrate S3/Cloudinary and update document upload flow when ready.
  - Monitor security events/login attempts via `SecurityEvent` and `UserSession` tables; add log shipping/observability as needed.

- **Where to go deeper**
  - `README.md`, `SETUP_GUIDE.md`, `PROJECT_SUMMARY.md` for setup and feature snapshots.
  - `SECURITY_IMPLEMENTATION_SUMMARY.md` and `SECURITY_CONFIGURATION.md` for detailed controls.
  - `BACKEND_API_REFERENCE.md`, `ADMIN_APP_API_INTEGRATION_GUIDE.md`, and `API_QUICK_REFERENCE.md` for endpoint specifics.
  - `ANALYTICS_ARCHITECTURE_IMPLEMENTATION_SUMMARY.md`, `RISK_MANAGEMENT_FEATURE_SUMMARY.md`, and the components under `src/app/analytics`, `src/app/risk`, and `src/app/forecasting` for analytics/risk/forecasting logic.

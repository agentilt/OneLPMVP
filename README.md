# EuroLP MVP - Limited Partner Portal

A secure, invitation-only portal for venture capital fund investors (Limited Partners) to access their portfolio information, documents, and fund performance data.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (credentials provider)
- **Email**: Nodemailer
- **UI Libraries**: Framer Motion, Recharts, Lucide React, Sonner

## Features

### For Limited Partners (Users)
- **Dashboard**: Portfolio overview with key metrics
- **Fund Cards**: Individual fund performance with sparkline charts
- **Fund Details**: Detailed fund view with NAV history chart and document viewer
- **Crypto Holdings**: View cryptocurrency portfolio
- **KYC Documents**: Upload and manage KYC documentation
- **Dark/Light Mode**: Theme toggle with localStorage persistence

### For Administrators
- **User Management**: Send invitations, manage user access
- **Fund Management**: Create and manage funds
- **Document Upload**: Manual document entry with metadata
- **Invitation System**: Time-limited, one-time use invitation tokens
- **Access Control**: Grant users access to specific funds

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database and update your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eurolp_mvp?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@eurolp.com"
ADMIN_EMAIL="admin@eurolp.com"
ADMIN_PASSWORD="SecurePassword123!"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with admin user and demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

After seeding:

- **Admin**: admin@eurolp.com / SecurePassword123!
- **Demo User**: demo@eurolp.com / demo123

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── register/       # Registration with token
│   ├── dashboard/          # User dashboard
│   ├── funds/[id]/         # Fund detail page
│   ├── crypto/             # Crypto holdings
│   ├── kyc/                # KYC documents
│   ├── admin/              # Admin panel
│   │   ├── users/          # User management
│   │   ├── funds/          # Fund management
│   │   └── documents/      # Document upload
│   └── api/
│       ├── auth/           # NextAuth API
│       ├── invitations/    # Invitation system
│       ├── register/       # User registration
│       └── admin/          # Admin API routes
├── components/
│   ├── Topbar.tsx          # Header with theme toggle
│   ├── Sidebar.tsx         # User navigation
│   ├── AdminSidebar.tsx    # Admin navigation
│   ├── FundCard.tsx        # Fund overview card
│   └── ThemeToggle.tsx     # Dark/light mode toggle
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client
│   ├── email.ts            # Email service
│   └── utils.ts            # Utility functions
└── middleware.ts           # Route protection
```

## Key Features Implementation

### Authentication & Security
- **NextAuth.js** with credentials provider
- **Invitation-only** registration (no public signup)
- **Password hashing** with bcrypt (12 rounds)
- **JWT sessions** with 30-day expiry
- **Route protection** via middleware
- **Role-based access** (USER/ADMIN)

### Invitation System
- Admin can send email invitations
- **Unique, one-time use tokens**
- **48-hour expiration** on invitations
- Token validation before registration
- Email sent via Nodemailer

### Data Entry Workflow
1. Navigate to `/admin/documents/upload`
2. Select fund from dropdown
3. Choose document type
4. Enter document details manually
5. Add optional metadata (JSON)
6. Save to database

### Design System
- **Light mode**: White background (#ffffff), dark foreground (#171717)
- **Dark mode**: Dark background (#0a0a0a), light foreground (#ededed)
- **Theme toggle**: Persisted in localStorage
- **Font**: Arial, Helvetica, sans-serif
- **Components**: 1px borders, rounded-lg corners, hover effects

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## Database Schema

### Models
- **User**: Authentication and profile
- **Invitation**: Token-based invitations
- **Fund**: Investment fund details
- **NavHistory**: NAV tracking over time
- **Document**: Capital calls, reports, KYC
- **FundAccess**: User-fund access control
- **CryptoHolding**: Cryptocurrency portfolio

### Enums
- **Role**: USER, ADMIN
- **DocumentType**: CAPITAL_CALL, QUARTERLY_REPORT, ANNUAL_REPORT, KYC, OTHER
- **PaymentStatus**: PENDING, PAID, LATE, OVERDUE

## Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use in `SMTP_PASSWORD` env variable

For other providers, update `SMTP_HOST` and `SMTP_PORT`.

## Security Best Practices

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with secret
- ✅ Environment variables for sensitive data
- ✅ Route protection with middleware
- ✅ Role-based access control
- ✅ Input validation on forms
- ✅ CSRF protection (NextAuth built-in)

## Future Enhancements

- [ ] File upload for documents (S3 integration)
- [ ] AI document parsing
- [ ] Email notifications for capital calls
- [ ] Multi-fund portfolio analytics
- [ ] Export data to Excel/PDF
- [ ] Activity audit logs
- [ ] Two-factor authentication
- [ ] API rate limiting

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Email Not Sending
- Check SMTP credentials
- For Gmail, use app password
- Verify SMTP_HOST and SMTP_PORT

### Dark Mode Not Working
- Check browser localStorage
- Clear cache and reload
- Verify ThemeToggle component

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.


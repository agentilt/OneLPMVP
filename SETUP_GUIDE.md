# 🚀 EuroLP MVP - Quick Setup Guide

Follow these steps to get your EuroLP platform running locally.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- (Optional) Gmail account for email invitations

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and UI libraries.

### 2️⃣ Create Environment File

```bash
cp .env.example .env
```

### 3️⃣ Configure Environment Variables

Open `.env` and fill in your details:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/eurolp_mvp?schema=public"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Email - Gmail example (optional for testing)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="noreply@eurolp.com"

# Admin Seed Credentials
ADMIN_EMAIL="admin@eurolp.com"
ADMIN_PASSWORD="ChangeThisPassword123!"
```

### 4️⃣ Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Create tables in database
npm run db:push

# Seed with admin user and demo data
npm run db:seed
```

### 5️⃣ Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## 🎉 You're Ready!

### Login Credentials

After seeding, you can login with:

**Admin Account:**
- Email: `admin@eurolp.com`
- Password: `ChangeThisPassword123!` (or what you set in .env)

**Demo User Account:**
- Email: `demo@eurolp.com`
- Password: `demo123`

## 📝 First Steps

### As Admin:

1. **Login** at `/login` with admin credentials
2. **Go to Admin Panel** - Click "Go to Admin Panel" button
3. **Invite a User** - Navigate to Users → Invite User
4. **Create a Fund** - Navigate to Funds → Create Fund
5. **Upload Documents** - Navigate to Documents → Upload Document

### As User (LP):

1. **Login** at `/login` with demo credentials
2. **View Dashboard** - See portfolio summary and fund cards
3. **Click on Fund** - View detailed fund information with charts
4. **Toggle Theme** - Try dark/light mode toggle in header

## 🔧 Gmail Setup (for Invitations)

To enable email invitations:

1. Go to your Google Account settings
2. Enable **2-Factor Authentication**
3. Generate an **App Password**: 
   - Account → Security → 2-Step Verification → App passwords
4. Use this password in `SMTP_PASSWORD` env variable

Without email setup, you can still:
- Manually create invitation tokens in the database
- Share registration links directly
- Test all other features

## 🗂️ Project Structure Overview

```
src/
├── app/
│   ├── login/              → Login page
│   ├── register/           → Registration with invitation
│   ├── dashboard/          → User dashboard
│   ├── funds/[id]/         → Individual fund view
│   ├── admin/              → Admin panel
│   │   ├── users/          → User management
│   │   ├── funds/          → Fund management
│   │   └── documents/      → Document upload
│   └── api/                → API routes
├── components/             → Reusable components
├── lib/                    → Utilities and config
└── middleware.ts           → Route protection
```

## 🎨 Features Implemented

✅ **Authentication**
- Login/Register with NextAuth
- Invitation-only registration
- Session management
- Route protection

✅ **User Dashboard**
- Portfolio summary (4 metrics cards)
- Fund cards with sparkline charts
- Fund detail page with NAV chart
- Document viewer

✅ **Admin Panel**
- User management & invitations
- Fund creation & management
- Document upload with metadata
- Activity dashboard

✅ **Design**
- Dark/Light theme toggle
- Responsive layout
- Framer Motion animations
- Tailwind CSS styling

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep eurolp_mvp

# Create database if needed
createdb eurolp_mvp
```

### Prisma Errors
```bash
# Reset and regenerate
npm run db:generate
npm run db:push
```

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

### Dark Mode Not Persisting
- Clear browser localStorage
- Hard refresh (Cmd/Ctrl + Shift + R)

## 📚 Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:studio          # Open Prisma Studio GUI
npm run db:seed            # Seed database with data

# Utilities
npm run lint               # Run ESLint
```

## 🔒 Security Notes

- Change default admin password immediately
- Keep `.env` file secure and never commit it
- Use strong passwords for production
- Enable HTTPS for production deployment
- Consider adding 2FA for admin accounts

## 📖 Next Steps

Once running:

1. **Customize branding** - Update colors, logo, and fonts
2. **Add more funds** - Create funds via admin panel
3. **Test invitation flow** - Send invitations to test users
4. **Upload documents** - Test document management
5. **Configure production database** - For deployment

## 🚀 Deployment

For production deployment:

1. Set up PostgreSQL database (e.g., Railway, Supabase)
2. Update environment variables
3. Deploy to Vercel/Railway/Render
4. Configure custom domain
5. Enable SSL/HTTPS

## 💬 Need Help?

- Check the main `README.md` for detailed documentation
- Review the `prisma/schema.prisma` for database structure
- Examine component files for implementation details

---

**Happy building! 🎉**


# ⚡ EuroLP MVP - Quickstart

## 🏃‍♂️ Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running (or use a cloud database)

---

## 📋 Steps

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
# Create .env file
cp .env.example .env

# Edit .env - REQUIRED fields:
# DATABASE_URL="postgresql://user:pass@localhost:5432/eurolp_mvp"
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
# (Email settings optional for testing)
```

### 3. Database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Run
```bash
npm run dev
```

### 5. Login
Open **http://localhost:3000**

**Admin**: `admin@eurolp.com` / `SecurePassword123!`  
**User**: `demo@eurolp.com` / `demo123`

---

## 🎯 What to Try

### As Admin (admin@eurolp.com)
1. Click **"Go to Admin Panel"**
2. Navigate to **Users** → Click **"Invite User"**
3. Navigate to **Funds** → Click **"Create Fund"**
4. Navigate to **Documents** → Click **"Upload Document"**

### As User (demo@eurolp.com)
1. View **Dashboard** - see 3 demo funds
2. Click on **any fund card** - see detailed view
3. Try **theme toggle** (moon/sun icon)
4. Check **Crypto** and **KYC** pages in sidebar

---

## 📁 Project Files

**Created**: 41 files including:
- 7 configuration files
- 2 database files (schema + seed)
- 8 API routes
- 12 pages (auth, user, admin)
- 6 reusable components
- 5 utility files
- 3 documentation files

**Database**: 7 models, 3 enums, full relationships

---

## 🔧 Common Issues

**Database connection failed?**
```bash
# Check if PostgreSQL is running
pg_isready

# Create database if needed
createdb eurolp_mvp
```

**Port 3000 in use?**
```bash
PORT=3001 npm run dev
```

**Seed fails?**
```bash
# Reset database
npm run db:push --force-reset
npm run db:seed
```

---

## 📖 Full Documentation

- `README.md` - Complete guide
- `SETUP_GUIDE.md` - Detailed setup
- `PROJECT_SUMMARY.md` - What was built

---

## ✅ You're Ready!

The platform is fully functional with:
✓ Authentication & Authorization  
✓ User Dashboard with Portfolio  
✓ Fund Detail Pages with Charts  
✓ Admin Panel for Management  
✓ Invitation System  
✓ Dark/Light Theme  

**Build something amazing! 🚀**


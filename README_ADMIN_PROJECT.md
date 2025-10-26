# Admin Project Documentation Index

This directory contains all the documentation needed to build an admin frontend that connects to your OneLPMVP backend.

## 📚 Documentation Files

### 1. **BACKEND_API_REFERENCE.md** (Start Here!)
Complete API documentation with:
- All endpoints (GET, POST, PUT, DELETE)
- Request/response formats
- Authentication requirements
- Data models and TypeScript types
- Error handling
- Environment configuration
- Code examples

**Use this for**: Understanding how to interact with the API

### 2. **ADMIN_APP_ARCHITECTURE.md**
Architecture overview explaining:
- Why keep backend in current project
- How to structure the new admin app
- Recommended tech stack
- Deployment considerations

**Use this for**: Understanding the overall architecture and design decisions

### 3. **ADMIN_FRONTEND_SETUP.md**
Step-by-step setup guide including:
- Project initialization
- Installation commands
- File structure
- Code examples for API client
- React hooks setup
- Component examples

**Use this for**: Setting up your new admin frontend project

### 4. **ADMIN_FRONTEND_CHEATSHEET.md**
Quick reference with:
- API endpoints at a glance
- Copy-paste code snippets
- Common patterns
- Troubleshooting tips

**Use this for**: Quick lookups while coding

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Backend running on localhost:3000

### Step 1: Review Architecture
Read `ADMIN_APP_ARCHITECTURE.md` to understand the design.

### Step 2: Set Up Backend (OneLPMVP)
```bash
cd OneLPMVP
npm install
npm run db:push
npm run dev
# Should run on http://localhost:3000
```

### Step 3: Create Admin Frontend
```bash
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
cd admin-dashboard
```

### Step 4: Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 5: Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-table axios
npm install lucide-react sonner zod
```

### Step 6: Set Up API Client
Follow the example in `ADMIN_FRONTEND_SETUP.md` section 5.

### Step 7: Build Your UI
Start with user management, then add funds and documents.

---

## 📋 Recommended Reading Order

1. **ADMIN_APP_ARCHITECTURE.md** - Understand the big picture
2. **BACKEND_API_REFERENCE.md** - Learn the API
3. **ADMIN_FRONTEND_SETUP.md** - Set up your project
4. **ADMIN_FRONTEND_CHEATSHEET.md** - Keep handy while coding

---

## 🎯 Key Decisions

### ✅ Where to Put Backend?
**Answer**: Keep it in the current project (OneLPMVP)

**Why?**
- Database is shared (Prisma)
- API endpoints already exist
- Authentication is already configured
- Single source of truth

### ✅ Admin App Architecture
**Pattern**: Backend API + Separate Frontend

```
Backend (OneLPMVP)                Frontend (New Project)
├── API Endpoints                ├── Admin Dashboard UI
├── Database (Prisma)            ├── Data Tables
├── Authentication               ├── Calls API endpoints
└── Business Logic               └── Focus on UX
```

### ✅ Communication
**Method**: REST API via HTTP/JSON

**Options**:
- Cookie-based authentication (current)
- API key authentication (add if needed)

---

## 🔗 API Base URL

**Development**: `http://localhost:3000`  
**Production**: Your production domain

All API endpoints under `/api/admin/*` require:
- Valid session (cookies)
- `ADMIN` role

---

## 📦 Tech Stack Recommendations

### Backend (Current Project)
- ✅ Next.js 15
- ✅ TypeScript
- ✅ Prisma ORM
- ✅ NextAuth.js
- ✅ PostgreSQL

### Admin Frontend (New Project)
**Recommended**:
- ✅ Next.js 15
- ✅ TypeScript
- ✅ TanStack Query (data fetching)
- ✅ TanStack Table (data grids)
- ✅ axios (HTTP client)
- ✅ Tailwind CSS (styling)
- ✅ shadcn/ui (components)
- ✅ Sonner (notifications)

---

## 🚨 Important Notes

### Authentication
- Backend uses session-based authentication
- Sessions stored in HTTP-only cookies
- Frontend must send `credentials: 'include'` with requests

### CORS Setup
If building a separate admin app, enable CORS in backend:

```javascript
// next.config.js in OneLPMVP
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
    ],
  }]
}
```

### Environment Variables
**Backend** (OneLPMVP):
```env
DATABASE_URL=...
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
```

**Frontend** (Admin App):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📖 API Endpoints Summary

### Users
- `GET /api/admin/users` - List users
- `GET /api/admin/users/[id]` - Get user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Funds
- `GET /api/admin/funds/list` - List funds
- `POST /api/admin/users/[id]/funds` - Create fund
- `PUT /api/admin/users/[id]/funds/[fundId]` - Update fund
- `DELETE /api/admin/users/[id]/funds/[fundId]` - Delete fund

### Documents
- `POST /api/admin/documents` - Create document
- `GET /api/admin/users/[id]/funds/[fundId]/documents` - List documents
- `POST /api/admin/users/[id]/funds/[fundId]/documents` - Create document for fund
- `DELETE /api/admin/users/[id]/funds/[fundId]/documents` - Delete document

### Invitations
- `GET /api/invitations` - List invitations
- `POST /api/invitations` - Create invitation

### Audit & Security
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/security` - Get security metrics

---

## 🛠️ Development Workflow

### Terminal 1: Backend
```bash
cd OneLPMVP
npm run dev
# http://localhost:3000
```

### Terminal 2: Admin Frontend
```bash
cd admin-dashboard
npm run dev
# http://localhost:3001
```

### Testing
1. Open admin app in browser: `http://localhost:3001`
2. Make API calls to backend
3. Check browser DevTools → Network tab
4. Verify responses in browser console

---

## 📝 Next Steps

1. **Read the architecture guide** - Understand the design
2. **Set up the backend** - Ensure it's running
3. **Create the frontend** - Follow setup guide
4. **Build user management** - Start with CRUD operations
5. **Add fund management** - Extend functionality
6. **Implement analytics** - Add dashboard

---

## 🐛 Troubleshooting

### CORS Errors
- Check CORS headers in backend
- Verify frontend URL is whitelisted
- Ensure `credentials: 'include'` in requests

### Authentication Errors
- Check cookies are being sent
- Verify session is valid
- Check user has ADMIN role

### API Not Found
- Verify backend is running
- Check API URL in environment
- Ensure endpoint exists

### Database Errors
- Check DATABASE_URL is set
- Run `npm run db:push` to sync schema
- Verify database is accessible

---

## 📞 Support

**Files to Reference**:
- API endpoints: `BACKEND_API_REFERENCE.md`
- Setup: `ADMIN_FRONTEND_SETUP.md`
- Quick ref: `ADMIN_FRONTEND_CHEATSHEET.md`
- Architecture: `ADMIN_APP_ARCHITECTURE.md`

**Backend Code**:
- API routes: `src/app/api/admin/`
- Database schema: `prisma/schema.prisma`
- Auth config: `src/lib/auth.ts`

---

## ✅ Checklist

Before building your admin frontend:

- [ ] Backend running on port 3000
- [ ] Database configured and migrated
- [ ] Read architecture guide
- [ ] Reviewed API documentation
- [ ] Created new frontend project
- [ ] Installed dependencies
- [ ] Configured environment variables
- [ ] Set up API client
- [ ] Implemented authentication
- [ ] Built first feature (user management)

---

## 🎉 You're Ready!

You now have all the context needed to build your admin frontend. The documentation covers:

- ✅ Complete API reference
- ✅ Architecture decisions
- ✅ Setup instructions
- ✅ Code examples
- ✅ Troubleshooting tips

**Start here**: Read `ADMIN_APP_ARCHITECTURE.md`, then `BACKEND_API_REFERENCE.md`, then follow `ADMIN_FRONTEND_SETUP.md`.

Happy coding! 🚀


# EuroLP Admin Application - Setup Guide

## Quick Start Commands

### 1. Create the Admin Application
```bash
# Navigate to your projects directory
cd /Users/agusgentil/Documents/GitHub

# Create new Vite + React + TypeScript project
npm create vite@latest euro-lp-admin -- --template react-ts

# Navigate to the new project
cd euro-lp-admin
```

### 2. Install Core Dependencies
```bash
# Install UI framework and components
npm install antd @ant-design/pro-components @ant-design/icons

# Install data fetching and state management
npm install @tanstack/react-query axios zustand

# Install routing and utilities
npm install react-router-dom clsx

# Install form handling
npm install react-hook-form @hookform/resolvers zod

# Install development dependencies
npm install -D @types/node
```

### 3. Copy Database Schema
```bash
# Copy Prisma schema from main project
cp ../OneLPMVP/prisma/schema.prisma ./prisma/

# Install Prisma
npm install prisma @prisma/client

# Generate Prisma client
npx prisma generate
```

### 4. Environment Setup
Create `.env.local` file:
```env
# Database (same as main app)
DATABASE_URL="postgresql://username:password@host:port/database"

# API Configuration
VITE_API_BASE_URL="http://localhost:3001"
VITE_NEXTAUTH_URL="http://localhost:3001"
VITE_NEXTAUTH_SECRET="your-secret-key"

# App Configuration
VITE_APP_NAME="EuroLP Admin"
VITE_APP_VERSION="1.0.0"
```

### 5. Project Structure Setup
```bash
# Create directory structure
mkdir -p src/{components,pages,services,stores,types,utils}
mkdir -p src/components/{common,forms,tables}
mkdir -p src/pages/{dashboard,users,funds,documents,audit-logs,settings}
mkdir -p src/pages/users/{create,[id]}
mkdir -p src/pages/funds/{create,[id]}
mkdir -p prisma
```

## Core Files to Create

### 1. Main App Component (`src/App.tsx`)
```typescript
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import AdminLayout from './components/common/Layout/AdminLayout'
import Dashboard from './pages/dashboard'
import Users from './pages/users'
import Funds from './pages/funds'
import Documents from './pages/documents'
import AuditLogs from './pages/audit-logs'
import Settings from './pages/settings'
import Login from './pages/login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="users/create" element={<Users />} />
              <Route path="users/:id/edit" element={<Users />} />
              <Route path="funds" element={<Funds />} />
              <Route path="funds/create" element={<Funds />} />
              <Route path="funds/:id/edit" element={<Funds />} />
              <Route path="documents" element={<Documents />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default App
```

### 2. API Service (`src/services/api.ts`)
```typescript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 3. Authentication Service (`src/services/auth.ts`)
```typescript
import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
}

export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
    refreshToken: string
    expiresIn: number
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/api/mobile/auth/login', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/api/mobile/auth/logout')
    localStorage.removeItem('access_token')
  },

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token')
    const response = await api.post('/api/mobile/auth/refresh', { refreshToken })
    return response.data.data
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  },

  isAdmin(): boolean {
    return this.hasRole('ADMIN')
  },

  isDataManager(): boolean {
    return this.hasRole('DATA_MANAGER')
  },
}
```

### 4. User Service (`src/services/users.ts`)
```typescript
import api from './api'

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
  emailVerified?: string
  createdAt: string
  updatedAt: string
}

export interface UsersResponse {
  users: User[]
}

export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/api/data-manager/users')
    return response.data.users
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get(`/api/data-manager/users/${id}`)
    return response.data.user
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post('/api/data-manager/users', data)
    return response.data.user
  },

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<User> {
    const response = await api.put(`/api/data-manager/users/${id}`, data)
    return response.data.user
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/data-manager/users/${id}`)
  },

  async grantFundAccess(userId: string, fundId: string): Promise<void> {
    await api.post(`/api/data-manager/fund-access`, { userId, fundId })
  },

  async revokeFundAccess(userId: string, fundId: string): Promise<void> {
    await api.delete(`/api/data-manager/fund-access`, { data: { userId, fundId } })
  },
}
```

### 5. Fund Service (`src/services/funds.ts`)
```typescript
import api from './api'

export interface Fund {
  id: string
  userId: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  irr: number
  tvpi: number
  dpi: number
  lastReportDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateFundData {
  userId: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
}

export const fundService = {
  async getFunds(): Promise<Fund[]> {
    const response = await api.get('/api/admin/funds/list')
    return response.data.funds
  },

  async getFund(id: string): Promise<Fund> {
    const response = await api.get(`/api/admin/funds/${id}`)
    return response.data.fund
  },

  async createFund(data: CreateFundData): Promise<Fund> {
    const response = await api.post('/api/admin/funds', data)
    return response.data.fund
  },

  async updateFund(id: string, data: Partial<CreateFundData>): Promise<Fund> {
    const response = await api.put(`/api/admin/funds/${id}`, data)
    return response.data.fund
  },

  async deleteFund(id: string): Promise<void> {
    await api.delete(`/api/admin/funds/${id}`)
  },
}
```

### 6. Audit Service (`src/services/audit.ts`)
```typescript
import api from './api'

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  description: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuditFilters {
  userId?: string
  action?: string
  resource?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export const auditService = {
  async getAuditLogs(filters: AuditFilters = {}): Promise<AuditLogsResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await api.get(`/api/admin/audit-logs?${params}`)
    return response.data
  },

  async getAuditLog(id: string): Promise<AuditLog> {
    const response = await api.get(`/api/admin/audit-logs/${id}`)
    return response.data.auditLog
  },
}
```

### 7. Auth Store (`src/stores/authStore.ts`)
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, User } from '../services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login({ email, password })
          
          localStorage.setItem('access_token', response.data.token)
          localStorage.setItem('refresh_token', response.data.refreshToken)
          localStorage.setItem('current_user', JSON.stringify(response.data.user))
          
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('current_user')
          
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },

      checkAuth: () => {
        const user = authService.getCurrentUser()
        const isAuthenticated = authService.isAuthenticated()
        
        set({
          user,
          isAuthenticated,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

### 8. Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 9. TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Development Workflow

### 1. Start Development Servers
```bash
# Terminal 1: Start main app (API server)
cd /Users/agusgentil/Documents/GitHub/OneLPMVP
npm run dev  # Runs on port 3001

# Terminal 2: Start admin app
cd /Users/agusgentil/Documents/GitHub/euro-lp-admin
npm run dev  # Runs on port 3002
```

### 2. Access Applications
- **Main Client App**: http://localhost:3001
- **Admin App**: http://localhost:3002
- **Prisma Studio**: http://localhost:5556

### 3. Test Credentials
- **Admin**: admin@eurolp.com / SecurePassword123!
- **Data Manager**: manager@eurolp.com / manager123
- **Demo User**: demo@eurolp.com / demo123

## Next Steps

1. **Create the basic layout** with sidebar navigation
2. **Implement authentication** flow with login/logout
3. **Build the dashboard** with key metrics
4. **Create user management** pages
5. **Implement fund management** functionality
6. **Add document management** features
7. **Build audit logs** viewer
8. **Add settings** and configuration

This setup provides a solid foundation for building a professional admin application that connects to your existing database and API endpoints.



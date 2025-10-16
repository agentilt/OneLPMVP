import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
  }
}


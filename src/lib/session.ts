import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { isFrontendOnlyMode } from './frontend-only'

const mockSession = {
  user: {
    id: 'mock-user-id',
    email: 'preview@onelp.local',
    name: 'Frontend Preview',
    role: 'ADMIN',
    mfaRequired: false,
    mfaEnabled: false,
  },
}

export async function getSessionOrMock() {
  if (isFrontendOnlyMode) {
    return mockSession as Awaited<ReturnType<typeof getServerSession>>
  }
  return getServerSession(authOptions)
}


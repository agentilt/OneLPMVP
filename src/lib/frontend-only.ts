export const isFrontendOnlyMode =
  process.env.NEXT_PUBLIC_DISABLE_BACKEND === '1' ||
  process.env.DISABLE_BACKEND === '1'

export function logFrontendOnly(message: string) {
  if (isFrontendOnlyMode) {
    console.log(`[frontend-only] ${message}`)
  }
}


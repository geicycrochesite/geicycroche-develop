import { jwtVerify } from 'jose'

export const AUTH_COOKIE_NAME = 'auth_token'
export type AdminSession = { id: string; email: string; role: string }

export function isAdminSession(value: unknown): value is AdminSession & { exp: number } {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  return typeof payload.id === 'string' && payload.id.length > 0 &&
    typeof payload.email === 'string' && payload.email.length > 0 &&
    typeof payload.role === 'string' && typeof payload.exp === 'number' &&
    payload.exp > Math.floor(Date.now() / 1000)
}

// Edge-compatible verification; each server operation also checks the database.
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'], requiredClaims: ['exp', 'iat'], maxTokenAge: '7d',
    })
    return isAdminSession(payload) ? payload : null
  } catch { return null }
}

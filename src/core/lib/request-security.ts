import { NextResponse } from 'next/server'

export function readCookie(header: string | null, name: string): string | undefined {
  const matches = (header || '').split(';').map(part => part.trim())
    .filter(part => part.startsWith(`${name}=`))
  if (matches.length !== 1) return undefined
  try { return decodeURIComponent(matches[0].slice(name.length + 1)) } catch { return undefined }
}

export function isSameOriginMutation(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

// Best effort per process. A shared limiter at the hosting edge is still recommended.
const attempts = new Map<string, { count: number; until: number }>()
export function allowAttempt(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  if (attempts.size > 10_000) {
    for (const [entry, value] of attempts) if (value.until <= now) attempts.delete(entry)
    if (attempts.size > 10_000) return false
  }
  const current = attempts.get(key)
  if (!current || current.until <= now) {
    attempts.set(key, { count: 1, until: now + windowMs })
    return true
  }
  return ++current.count <= limit
}

export function mutationGuard(request: Request, scope: string): Response | null {
  if (!isSameOriginMutation(request)) return privateJson({ error: 'Origem não permitida.' }, 403)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (!allowAttempt(`${scope}:${ip}`)) return privateJson({ error: 'Aguarde antes de tentar novamente.' }, 429)
  return null
}

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

// Adapted from E&L: signed, temporary grants without introducing a buyer account.
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createHmac } from 'node:crypto'
import { authenticateAdmin } from '@/core/lib/admin-access'
import { prisma } from '@/core/lib/prisma'

const cookieName = 'order_access'
const maxAge = 60 * 60 * 24
type OrderGrant = { orders: string[]; identity?: string }

function identityHash(email: string, cpf: string): string {
  return createHmac('sha256', process.env.AUTH_JWT_SECRET!)
    .update(JSON.stringify([email.trim().toLowerCase(), cpf.replace(/\D/g, '')])).digest('hex')
}

export async function isOrderAdmin(): Promise<boolean> {
  return (await authenticateAdmin((await cookies()).get('auth_token')?.value)).status === 200
}

async function grantedOrders(): Promise<OrderGrant> {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return { orders: [] }
  try {
    const payload = jwt.verify(token, process.env.AUTH_JWT_SECRET!, {
      audience: 'order-access', algorithms: ['HS256'], maxAge: maxAge,
    })
    if (typeof payload === 'string' || !Array.isArray(payload.orders) || typeof payload.exp !== 'number') return { orders: [] }
    return { orders: payload.orders.filter((id: unknown): id is string => typeof id === 'string'),
      identity: typeof payload.identity === 'string' ? payload.identity : undefined }
  } catch { return { orders: [] } }
}

export async function canAccessOrder(id: string): Promise<boolean> {
  if (!id || id.length > 128) return false
  if (await isOrderAdmin()) return true
  const grant = await grantedOrders()
  if (grant.orders.includes(id)) return true
  if (!grant.identity) return false
  const order = await prisma.order.findUnique({ where: { id }, select: { email: true, cpf: true } })
  return !!order && identityHash(order.email, order.cpf) === grant.identity
}

export async function hasOrderAccess(): Promise<boolean> {
  if (await isOrderAdmin()) return true
  const grant = await grantedOrders()
  return grant.orders.length > 0 || !!grant.identity
}

export async function grantOrderAccess(response: NextResponse, ids: string[], replace = false,
  identity?: { email: string; cpf: string }) {
  const previous = replace ? { orders: [] } : await grantedOrders()
  const orders = [...new Set([...previous.orders, ...ids])].slice(-20)
  // An identity fingerprint authorizes every matching result without an oversized cookie.
  const token = jwt.sign({ orders, identity: identity ? identityHash(identity.email, identity.cpf) : previous.identity },
    process.env.AUTH_JWT_SECRET!, { audience: 'order-access', expiresIn: maxAge, algorithm: 'HS256' })
  response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

import jwt from 'jsonwebtoken'
import { timingSafeEqual, createHmac } from 'node:crypto'

export function cents(value: unknown): number {
  const number = Number(String(value))
  const result = Math.round(number * 100)
  if (!Number.isFinite(number) || number < 0 || !Number.isSafeInteger(result)) throw new Error('Valor inválido.')
  return result
}

// Order.total historically stores the merchandise subtotal; shipping is separate.
export function payableTotal(order: { total: unknown; frete: unknown }): number {
  const amount = cents(order.total) + cents(order.frete ?? 0)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Valor inválido.')
  return amount / 100
}

export function signShippingQuote(zip: string, quantity: number, price: string, serviceId: number): string {
  return jwt.sign({ zip, quantity, price, serviceId }, process.env.AUTH_JWT_SECRET!, {
    algorithm: 'HS256', audience: 'shipping-quote', expiresIn: '20m',
  })
}

export function verifyShippingQuote(token: unknown, zip: string, quantity: number, price: unknown): number {
  if (typeof token !== 'string') throw new Error('Recalcule o frete antes de finalizar.')
  const quote = jwt.verify(token, process.env.AUTH_JWT_SECRET!, { algorithms: ['HS256'], audience: 'shipping-quote', maxAge: '20m' })
  if (typeof quote === 'string' || typeof quote.exp !== 'number' || quote.zip !== zip || quote.quantity !== quantity ||
      cents(quote.price) !== cents(price)) throw new Error('Recalcule o frete antes de finalizar.')
  return cents(quote.price) / 100
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left), b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function verifyMercadoPagoWebhook(request: Request, secret: string): boolean {
  const dataId = new URL(request.url).searchParams.get('data.id')?.toLowerCase()
  const requestId = request.headers.get('x-request-id')
  const signature = request.headers.get('x-signature') || ''
  const parts = signature.split(',').map(part => part.trim().split('='))
  const ts = parts.find(([key]) => key === 'ts')?.[1]
  const v1 = parts.find(([key]) => key === 'v1')?.[1]
  if (!dataId || !requestId || !ts || !/^\d+$/.test(ts) || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) return false
  const hash = createHmac('sha256', secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex')
  return safeEqual(hash, v1.toLowerCase())
}

export function normalizedAsaasStatus(status: string): string | null {
  return ({ CONFIRMED: 'approved', RECEIVED: 'approved', RECEIVED_IN_CASH: 'approved',
    PENDING: 'pending', OVERDUE: 'overdue', REFUNDED: 'refunded',
    REFUND_REQUESTED: 'refund_pending', CHARGEBACK_REQUESTED: 'disputed',
    CHARGEBACK_DISPUTE: 'disputed', AWAITING_CHARGEBACK_REVERSAL: 'disputed' } as Record<string, string>)[status] || null
}

// Only copied into the disposable test application, never imported by production.
import { prisma } from '@/core/lib/prisma'
export async function mpTestFetch(input: string, options: RequestInit) {
  if (process.env.UPNODE_MP_ISOLATED_TEST !== 'yes' || !/@127\.0\.0\.1:\d+\/upnode_mp_/.test(process.env.DATABASE_URL ?? '')) throw Error('Isolated test only')
  const path = new URL(input).pathname
  if (path === '/users/me') return Response.json({ id: 123, nickname: 'Vendedor Sintético', tags: ['test_user'], site_id: 'MLB' })
  if (path === '/oauth/token') return Response.json({ access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', public_key: 'synthetic-oauth-key', user_id: 123, expires_in: 3600 })
  if (path === '/v1/orders' && options.method === 'POST') {
    const body = JSON.parse(String(options.body))
    return Response.json(snapshot('ORD' + body.external_reference, body.external_reference, body.total_amount, false))
  }
  if (path.startsWith('/v1/orders/')) {
    const payment = await prisma.mercadoPagoPayment.findUniqueOrThrow({ where: { providerId: path.split('/').at(-1) } })
    return Response.json(snapshot(payment.providerId!, payment.id, (payment.totalCents / 100).toFixed(2), true))
  }
  throw Error('Real provider calls forbidden')
}
function snapshot(id: string, reference: string, amount: string, paid: boolean) {
  return { id, external_reference: reference, user_id: '123', total_amount: amount, country_code: 'BRA',
    status: paid ? 'processed' : 'action_required', status_detail: paid ? 'accredited' : 'waiting_transfer',
    transactions: { payments: [{ amount, ...(paid ? { paid_amount: amount } : {}), payment_method: { qr_code: 'SIMULACAO-SEM-VALOR-FINANCEIRO' } }] } }
}

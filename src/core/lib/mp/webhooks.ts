import 'server-only'
import { z } from 'zod'
import { prisma } from '@/core/lib/prisma'
import { verifyMercadoPagoWebhook } from '@/core/lib/commerce-security'
import { privateJson } from '@/core/lib/request-security'
import { accessFor, readOrder } from './client'
import { hash, required } from './security'
import { closeWeek, reconcile } from './ledger'
import { synchronizePayment } from './orders'

export async function processEvent(key: string) {
  const event = await prisma.mercadoPagoWebhookEvent.findUniqueOrThrow({ where: { key } })
  if (event.status === 'processed') return
  try {
    const account = await prisma.mercadoPagoAccount.findUniqueOrThrow({ where: { userId: event.userId } })
    const snapshot = await readOrder(event.resourceId, await accessFor(account.id))
    if (snapshot.id !== event.resourceId || snapshot.user_id !== event.userId) throw new Error('Evento divergente')
    await reconcile(account.id, snapshot)
    await prisma.mercadoPagoWebhookEvent.update({ where: { key }, data: { status: 'processed', processedAt: new Date(), attempts: { increment: 1 } } })
  } catch {
    await prisma.mercadoPagoWebhookEvent.updateMany({ where: { key, status: { not: 'processed' } }, data: { status: 'failed', attempts: { increment: 1 } } })
    throw new Error('Evento pendente de recuperação')
  }
}
export async function acceptWebhook(request: Request) {
  if (!verifyMercadoPagoWebhook(request, required('MP_WEBHOOK_SECRET'))) return privateJson({ error: 'Assinatura inválida.' }, 401)
  const body = z.object({ type: z.literal('order'), user_id: z.union([z.string(), z.number()]), id: z.union([z.string(), z.number()]).optional(),
    date_created: z.string().optional(), action: z.string().optional(), data: z.object({ id: z.string().regex(/^ORD[A-Za-z0-9_-]{1,100}$/) }) }).parse(await request.json())
  if (new URL(request.url).searchParams.get('data.id') !== body.data.id) return privateJson({ error: 'Recurso divergente.' }, 400)
  const key = hash(`${body.type}:${body.id ?? body.date_created ?? request.headers.get('x-signature')}:${body.action ?? ''}:${body.user_id}:${body.data.id}`)
  await prisma.mercadoPagoWebhookEvent.createMany({ data: [{ key, resourceId: body.data.id, userId: String(body.user_id) }], skipDuplicates: true })
  try { await processEvent(key); return privateJson({ received: true }) }
  catch { return privateJson({ received: true, retry: true }, 503) }
}
export async function recover() {
  let processed = 0, failed = 0
  const deadline = Date.now() + 210000
  const events = await prisma.mercadoPagoWebhookEvent.findMany({ where: { status: { not: 'processed' } }, orderBy: [{ attempts: 'asc' }, { receivedAt: 'asc' }], take: 10 })
  for (const event of events) {
    if (Date.now() > deadline) break
    try { await processEvent(event.key); processed++ } catch { failed++ }
  }
  const payments = await prisma.mercadoPagoPayment.findMany({ where: { AND: [
    { OR: [{ providerId: { not: null } }, { requestBody: { not: null } }] },
    { OR: [{ checkedAt: null }, { checkedAt: { lt: new Date(Date.now() - 3600000) } }] },
  ] },
    orderBy: [{ checkedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }], take: 10 })
  for (const payment of payments) {
    if (Date.now() > deadline) break
    try { await synchronizePayment(payment.id); processed++ }
    catch { failed++; await prisma.mercadoPagoPayment.update({ where: { id: payment.id }, data: { checkedAt: new Date() } }) }
  }
  await prisma.mercadoPagoOAuthAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  await closeWeek()
  return { processed, failed }
}

import 'server-only'
import { z } from 'zod'
import { prisma } from '@/core/lib/prisma'
import { cents, payableTotal } from '@/core/lib/commerce-security'
import { checkoutReady, decrypt, encrypt, hash, MERCHANT } from './security'
import { accessFor, mp, MpHttpError, orderPayload, providerOrder, readOrder } from './client'
import { lock, reconcile } from './ledger'

const input = z.object({ orderId: z.string().min(1).max(128), requestKey: z.uuid(), method: z.enum(['pix', 'card']),
  token: z.string().min(1).max(200).optional(), payment_method_id: z.string().regex(/^[a-z0-9_]{1,40}$/).optional(),
  identification: z.object({ type: z.enum(['CPF', 'CNPJ']), number: z.string().regex(/^\d{11}(\d{3})?$/) }).strict().optional(),
}).strict()
export async function createPayment(body: unknown) {
  const data = input.parse(body)
  if (!checkoutReady()) throw new Error('Checkout não configurado')
  if (data.method === 'card' && (!data.token || !data.payment_method_id)) throw new Error('Tokenização necessária')
  const fingerprint = hash(JSON.stringify(data))
  const payment = await prisma.$transaction(async tx => {
    await lock(tx, MERCHANT)
    await lock(tx, data.orderId)
    const order = await tx.order.findUniqueOrThrow({ where: { id: data.orderId } })
    if (order.paymentProvider !== 'mercado_pago') throw new Error('Provedor do pedido divergente')
    const previous = await tx.mercadoPagoPayment.findUnique({ where: { orderId_requestKey: { orderId: order.id, requestKey: data.requestKey } } })
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error('Chave reutilizada com dados diferentes')
      return previous
    }
    if (['approved', 'refunded', 'disputed', 'refund_pending'].includes(order.statusPagamento ?? '')) throw new Error('Pedido liquidado')
    const pending = await tx.mercadoPagoPayment.findFirst({ where: { orderId: order.id, status: { notIn: ['failed', 'canceled', 'cancelled'] } } })
    if (pending) throw new Error('Já existe tentativa em andamento; aguarde a confirmação')
    const settings = await tx.paymentSettings.findUnique({ where: { id: MERCHANT }, include: { account: true } })
    if (!settings?.account?.access || !settings.account.confirmedAt) throw new Error('Conta recebedora não confirmada')
    const totalCents = cents(payableTotal(order))
    const subtotal = order.total
    if (cents(subtotal) <= 0) throw new Error('Total inválido')
    const row = await tx.mercadoPagoPayment.create({ data: { orderId: order.id, accountId: settings.account.id,
      requestKey: data.requestKey, fingerprint, method: data.method, totalCents } })
    const payload = orderPayload(row.id, totalCents, order.email, data.method, data.method === 'card' ? { token: data.token!, payment_method_id: data.payment_method_id!, identification: data.identification } : undefined)
    return tx.mercadoPagoPayment.update({ where: { id: row.id }, data: { requestBody: encrypt(JSON.stringify(payload)) } })
  })
  await synchronizePayment(payment.id)
  return paymentView(data.orderId)
}
export async function synchronizePayment(id: string) {
  const payment = await prisma.mercadoPagoPayment.findUniqueOrThrow({ where: { id } })
  const access = await accessFor(payment.accountId)
  let snapshot
  if (payment.providerId) snapshot = await readOrder(payment.providerId, access)
  else {
    // An uncertain HTTP response is retried with the exact persisted body and key.
    // Holding the account lock also serializes disconnect against charge creation.
    try { snapshot = await prisma.$transaction(async tx => {
      await lock(tx, `mp-account:${payment.accountId}`)
      const account = await tx.mercadoPagoAccount.findUniqueOrThrow({ where: { id: payment.accountId } })
      if (!account.access || !account.confirmedAt || !checkoutReady()) throw new Error('Conta desconectada')
      const current = await tx.mercadoPagoPayment.findUniqueOrThrow({ where: { id } })
      if (current.providerId) return readOrder(current.providerId, access)
      if (!current.requestBody) throw new Error('Solicitação ausente')
      return providerOrder.parse(await mp('/v1/orders', access, 'POST', JSON.parse(decrypt(current.requestBody)), `${MERCHANT}-${current.id}`))
    }, { timeout: 25000 }) }
    catch (error) {
      // Only a definitive validation rejection permits a fresh payment intent.
      // Timeouts/5xx retain the body and key for safe recovery.
      if (error instanceof MpHttpError && [400, 422].includes(error.status))
        await prisma.mercadoPagoPayment.updateMany({ where: { id, providerId: null, status: 'created' }, data: { status: 'failed', detail: 'validation_error', requestBody: null, checkedAt: new Date() } })
      throw error
    }
  }
  return reconcile(payment.accountId, snapshot)
}
export async function paymentView(orderId: string) {
  const payment = await prisma.mercadoPagoPayment.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } })
  if (!payment) return null
  const pendingPix = payment.status === 'action_required' && payment.detail === 'waiting_transfer'
  return { id: payment.id, status: payment.status, detail: payment.detail, method: payment.method,
    totalCents: payment.totalCents, qrCode: pendingPix ? payment.qrCode : null, qrImage: pendingPix ? payment.qrImage : null }
}

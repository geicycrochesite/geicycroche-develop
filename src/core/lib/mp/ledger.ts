import 'server-only'
import { prisma } from '@/core/lib/prisma'
import { cents, payableTotal } from '@/core/lib/commerce-security'
import { type Prisma } from '@/generated/client'
import { type ProviderOrder } from './client'
import { COMMISSION_CENTS, centsFromMoney, financialState, money, totals, weekStart } from './accounting'
import { MERCHANT } from './security'

export async function lock(tx: Prisma.TransactionClient, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`
}
export async function reconcile(accountId: string, snapshot: ProviderOrder) {
  return prisma.$transaction(async tx => {
    // Shared merchant lock serializes ledger entries and weekly closing.
    await lock(tx, MERCHANT)
    const payment = await tx.mercadoPagoPayment.findUniqueOrThrow({ where: { id: snapshot.external_reference }, include: { order: true, account: true } })
    await lock(tx, payment.orderId)
    const order = payment.order
    if (payment.accountId !== accountId || payment.account.userId !== snapshot.user_id || order.paymentProvider !== 'mercado_pago' ||
        snapshot.country_code !== 'BRA' || snapshot.total_amount !== money(payment.totalCents) || cents(payableTotal(order)) !== payment.totalCents ||
        snapshot.transactions.payments.length !== 1 || snapshot.transactions.payments[0].amount !== money(payment.totalCents) ||
        (payment.providerId && payment.providerId !== snapshot.id)) throw new Error('Divergência de vínculo ou valor')
    const state = financialState(snapshot.status, snapshot.status_detail), item = snapshot.transactions.payments[0]
    if (state === 'paid' && item.paid_amount !== money(payment.totalCents)) throw new Error('Crédito divergente')
    if (state !== 'unpaid') await tx.upnodeCommissionEntry.upsert({ where: { key: `${order.id}:commission` },
      create: { key: `${order.id}:commission`, orderId: order.id, kind: 'commission', cents: COMMISSION_CENTS, salesCents: payment.totalCents }, update: {} })
    if (state === 'reversed') {
      await tx.upnodeCommissionEntry.upsert({ where: { key: `${order.id}:reversal` },
        create: { key: `${order.id}:reversal`, orderId: order.id, kind: 'credit', cents: -COMMISSION_CENTS }, update: {} })
      const refunded = snapshot.status === 'refunded' ? payment.totalCents : centsFromMoney(item.refunded_amount ?? (snapshot.status_detail === 'partially_refunded' ? '' : '0.00'))
      if (refunded > payment.totalCents) throw new Error('Estorno divergente')
      const prior = await tx.upnodeCommissionEntry.aggregate({ where: { orderId: order.id }, _sum: { refundCents: true } })
      const delta = refunded - (prior._sum.refundCents ?? 0)
      if (delta > 0) await tx.upnodeCommissionEntry.create({ data: { key: `${order.id}:refund:${refunded}`, orderId: order.id, kind: 'refund', cents: 0, refundCents: delta } })
    }
    const keep = (payment.reversed && state !== 'reversed') || (payment.status === 'refunded' && snapshot.status !== 'refunded') ||
      (financialState(payment.status, payment.detail) === 'paid' && state === 'unpaid')
    const updated = await tx.mercadoPagoPayment.update({ where: { id: payment.id }, data: { providerId: snapshot.id, requestBody: null,
      ...(!keep ? { status: snapshot.status, detail: snapshot.status === 'failed' && item.status_detail ? item.status_detail : snapshot.status_detail } : {}), reversed: payment.reversed || state === 'reversed',
      qrCode: item.payment_method.qr_code, qrImage: item.payment_method.qr_code_base64, checkedAt: new Date() } })
    // Terminal state never regresses, even across different failed payment attempts.
    const settled = ['approved', 'refunded', 'disputed']
    const status = state === 'reversed' ? (snapshot.status === 'charged_back' ? 'disputed' : 'refunded') : state === 'paid' ? 'approved' :
      snapshot.status === 'failed' ? 'rejected' : snapshot.status === 'canceled' || snapshot.status === 'cancelled' ? 'cancelled' : 'pending'
    if (!(settled.includes(order.statusPagamento ?? '') && state === 'unpaid') &&
        !(['refunded', 'disputed'].includes(order.statusPagamento ?? '') && status === 'approved') && !keep)
      await tx.order.update({ where: { id: order.id }, data: { statusPagamento: status } })
    return updated
  })
}

export async function closeWeek(end = weekStart()) {
  if (end > weekStart() || end.getTime() !== weekStart(end).getTime()) throw new Error('Somente semanas encerradas')
  const start = new Date(end.getTime() - 7 * 86400000)
  return prisma.$transaction(async tx => {
    await lock(tx, MERCHANT)
    const existing = await tx.upnodeWeeklyStatement.findUnique({ where: { start } })
    if (existing) return existing
    const latest = await tx.upnodeWeeklyStatement.findFirst({ orderBy: { end: 'desc' } })
    if (latest && latest.end > start) throw new Error('Fechamento fora de sequência')
    const settings = await tx.paymentSettings.upsert({ where: { id: MERCHANT }, create: { id: MERCHANT }, update: {} })
    const entries = await tx.upnodeCommissionEntry.findMany({ where: { statementId: null, createdAt: { lt: end } } })
    const result = totals(entries, settings.creditCents)
    const statement = await tx.upnodeWeeklyStatement.create({ data: { start, end, ...result, status: 'billing_disabled' } })
    await tx.upnodeCommissionEntry.updateMany({ where: { key: { in: entries.map(e => e.key) }, statementId: null }, data: { statementId: statement.id } })
    await tx.paymentSettings.update({ where: { id: MERCHANT }, data: { creditCents: result.closingCredit } })
    return statement
  })
}

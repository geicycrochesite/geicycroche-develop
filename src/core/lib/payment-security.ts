import { prisma } from '@/core/lib/prisma'
import { payableTotal, cents } from '@/core/lib/commerce-security'

export async function applyVerifiedPayment(orderId: string, value: unknown, status: string,
  customerId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || cents(value) !== cents(payableTotal(order)) ||
      (customerId !== undefined && order.customerId !== customerId)) return false
  // Compare-and-set makes redelivery a no-op and avoids clobbering a parallel update.
  // A late pending/rejected event must not undo settlement or refund/chargeback.
  const settled = ['approved', 'refunded', 'refund_pending', 'disputed']
  if (order.statusPagamento === status ||
      (settled.includes(order.statusPagamento || '') && ['pending', 'overdue', 'rejected', 'cancelled'].includes(status)) ||
      (['refunded', 'refund_pending', 'disputed'].includes(order.statusPagamento || '') && status === 'approved')) return true
  const result = await prisma.order.updateMany({ where: { id: orderId, statusPagamento: order.statusPagamento }, data: { statusPagamento: status } })
  if (result.count !== 1) throw new Error('Payment state changed; retry notification')
  return true
}

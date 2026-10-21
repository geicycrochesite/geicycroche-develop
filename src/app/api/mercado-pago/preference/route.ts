import { withModuleApi } from '@/core/lib/module-server'
import { NextRequest } from 'next/server'
import { prisma } from '@/core/lib/prisma'
import { canAccessOrder } from '@/core/lib/order-access'
import { mutationGuard, privateJson } from '@/core/lib/request-security'
import { cents, payableTotal } from '@/core/lib/commerce-security'
async function POST(req: NextRequest) {
  const guard = mutationGuard(req, 'mp-preference')
  if (guard) return guard
  const body = await req.json().catch(() => null)
  if (typeof body?.orderId !== 'string' || !await canAccessOrder(body.orderId)) return privateJson({ error: 'Pedido não encontrado.' }, 404)
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!accessToken || !siteUrl) return privateJson({ error: 'Pagamento indisponível.' }, 503)
  try {
    const order = await prisma.order.findUnique({ where: { id: body.orderId }, include: { items: true } })
    if (!order) return privateJson({ error: 'Pedido não encontrado.' }, 404)
    if (order.paymentProvider === 'mercado_pago') return privateJson({ error: 'Utilize o checkout transparente deste pedido.' }, 409)
    if (['approved', 'refunded', 'refund_pending', 'disputed'].includes(order.statusPagamento || '')) return privateJson({ error: 'Pedido já liquidado.' }, 409)
    const subtotal = order.items.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0)
    if (subtotal !== cents(order.total) || cents(payableTotal(order)) !== subtotal + cents(order.frete || 0)) return privateJson({ error: 'Pedido inconsistente.' }, 409)
    const items = order.items.map(item => ({ id: item.productId, title: item.name, quantity: item.quantity, currency_id: 'BRL', unit_price: cents(item.price) / 100 }))
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, shipments: { cost: cents(order.frete || 0) / 100, mode: 'not_specified' },
        back_urls: { success: siteUrl + '/loja/pedido/' + order.id, failure: siteUrl + '/loja/pedido/' + order.id, pending: siteUrl + '/loja/pedido/' + order.id },
        auto_return: 'approved', notification_url: siteUrl + '/api/mercado-pago/webhook', external_reference: order.id, payer: { email: order.email } }),
    })
    if (!response.ok) return privateJson({ error: 'Não foi possível iniciar o pagamento.' }, 502)
    const data = await response.json()
    return privateJson({ init_point: data.init_point, id: data.id })
  } catch { return privateJson({ error: 'Não foi possível iniciar o pagamento.' }, 502) }
}

const modulePOST = withModuleApi('/api/mercado-pago/preference', POST)
export { modulePOST as POST }

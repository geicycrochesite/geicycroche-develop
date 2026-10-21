export const runtime = 'nodejs'
export const maxDuration = 90
import { acceptWebhook } from '@/core/lib/mp/webhooks'
import { withModuleApi } from '@/core/lib/module-server'
import { NextRequest } from 'next/server'
import { verifyMercadoPagoWebhook } from '@/core/lib/commerce-security'
import { fetchMercadoPagoPayment } from '@/core/lib/mercado-pago-security'
import { applyVerifiedPayment } from '@/core/lib/payment-security'
import { privateJson } from '@/core/lib/request-security'
async function POST(req: NextRequest) {
  const notification = await req.clone().json().catch(() => null)
  if (notification?.type === 'order') {
    try { return await acceptWebhook(req) } catch { return privateJson({ error: 'Notificação pendente de recuperação.' }, 503) }
  }
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!secret || !token) return privateJson({ error: 'Webhook não configurado.' }, 503)
  if (!verifyMercadoPagoWebhook(req, secret)) return privateJson({ error: 'Notificação não autorizada.' }, 401)
  const id = req.nextUrl.searchParams.get('data.id')!
  if (!/^\d{1,30}$/.test(id)) return privateJson({ error: 'Pagamento inválido.' }, 400)
  const body = await req.json().catch(() => null)
  if (body?.type !== 'payment') return privateJson({ status: 'ignored' })
  if (String(body?.data?.id) !== id) return privateJson({ error: 'Notificação inválida.' }, 400)
  try {
    const payment = await fetchMercadoPagoPayment(id, token)
    if (!payment) return privateJson({ error: 'Provedor indisponível.' }, 503)
    if (String(payment.id) !== id || payment.currency_id !== 'BRL' || !payment.external_reference) return privateJson({ error: 'Pagamento inválido.' }, 400)
    if (!['approved', 'pending', 'in_process', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) return privateJson({ status: 'ignored' })
    const status = payment.status === 'in_process' ? 'pending' : payment.status === 'charged_back' ? 'disputed' : payment.status
    if (!await applyVerifiedPayment(payment.external_reference, payment.transaction_amount, status)) return privateJson({ error: 'Pagamento incompatível com pedido.' }, 400)
    return privateJson({ success: true })
  } catch { return privateJson({ error: 'Não foi possível confirmar a notificação.' }, 503) }
}

const modulePOST = withModuleApi('/api/mercado-pago/webhook', POST)
export { modulePOST as POST }

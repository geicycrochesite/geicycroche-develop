import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/core/lib/prisma'
import { withAdmin } from '@/core/lib/admin-access'
import { canAccessOrder } from '@/core/lib/order-access'
import { withModuleApi } from '@/core/lib/module-server'
import { mutationGuard, privateJson } from '@/core/lib/request-security'
import { safeEqual } from '@/core/lib/commerce-security'
import { startOAuth, finishOAuth, disconnectAccount } from '@/core/lib/mp/oauth'
import { accessFor, publicKeyFor } from '@/core/lib/mp/client'
import { baseUrl, checkoutReady, MERCHANT, oauthReady, required } from '@/core/lib/mp/security'
import { lock } from '@/core/lib/mp/ledger'
import { createPayment, paymentView } from '@/core/lib/mp/orders'
import { recover } from '@/core/lib/mp/webhooks'

export const runtime = 'nodejs'
export const maxDuration = 300
const settingsPath = '/admin/configuracoes/pagamentos'
const admin = withAdmin(async (request: NextRequest) => {
  const path = request.nextUrl.pathname.split('/api/mercado-pago/')[1]
  if (path === 'oauth/start' && request.method === 'POST') return startOAuth(request)
  if (path === 'oauth/callback' && request.method === 'GET') return finishOAuth(request)
  if (path === 'oauth/disconnect' && request.method === 'POST') {
    await disconnectAccount()
    return new Response(null, { status: 303, headers: { Location: baseUrl() + settingsPath } })
  }
  if (path === 'settings' && request.method === 'GET') {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: MERCHANT }, include: { account: true } })
    const account = settings?.account
    return privateJson({ provider: settings?.provider ?? 'asaas', connected: !!account?.access,
      account: account ? { userId: account.userId, label: account.label, confirmed: !!account.confirmedAt } : null,
      oauthReady: oauthReady(), checkoutReady: checkoutReady(), environment: process.env.MP_ENVIRONMENT ?? 'disabled', billingEnabled: false,
      statements: await prisma.upnodeWeeklyStatement.findMany({ orderBy: { start: 'desc' }, take: 12 }),
      entries: await prisma.upnodeCommissionEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
      pendingEvents: await prisma.mercadoPagoWebhookEvent.count({ where: { status: { not: 'processed' } } }),
    })
  }
  if (path === 'settings' && request.method === 'POST') {
    const data = z.object({ provider: z.enum(['mercado_pago', 'asaas']) }).strict().parse(await request.json())
    await prisma.$transaction(async tx => {
      await lock(tx, MERCHANT)
      const settings = await tx.paymentSettings.findUnique({ where: { id: MERCHANT }, include: { account: true } })
      if (data.provider === 'mercado_pago' && (!checkoutReady() || !settings?.account?.access || !settings.account.confirmedAt)) throw new Error('Integração não pronta')
      await tx.paymentSettings.upsert({ where: { id: MERCHANT }, create: { id: MERCHANT, provider: data.provider }, update: { provider: data.provider } })
    })
    return privateJson({ success: true })
  }
  if (path === 'oauth/confirm' && request.method === 'POST') {
    const data = z.object({ userId: z.string().regex(/^\d+$/) }).strict().parse(await request.json())
    const settings = await prisma.paymentSettings.findUniqueOrThrow({ where: { id: MERCHANT } })
    if (!settings.accountId) throw new Error('Conta ausente')
    await accessFor(settings.accountId)
    await prisma.$transaction(async tx => {
      await lock(tx, MERCHANT)
      const current = await tx.paymentSettings.findUniqueOrThrow({ where: { id: MERCHANT }, include: { account: true } })
      if (!current.account?.access || current.accountId !== settings.accountId || current.account.userId !== data.userId) throw new Error('Conta alterada')
      await tx.mercadoPagoAccount.update({ where: { id: current.account.id }, data: { confirmedAt: new Date() } })
    })
    return privateJson({ success: true })
  }
  return privateJson({ error: 'Não encontrado.' }, 404)
})
async function handler(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname.split('/api/mercado-pago/')[1]
    if (path === 'jobs' && request.method === 'GET') {
      if (!safeEqual(request.headers.get('authorization') ?? '', 'Bearer ' + required('CRON_SECRET'))) return privateJson({ error: 'Não autorizado.' }, 401)
      return privateJson(await recover())
    }
    if (path === 'payment') {
      const body = request.method === 'POST' ? await request.json() : null
      const orderId = body?.orderId ?? request.nextUrl.searchParams.get('orderId')
      if (typeof orderId !== 'string' || !await canAccessOrder(orderId)) return privateJson({ error: 'Pedido não encontrado.' }, 404)
      if (request.method === 'POST') {
        const guard = mutationGuard(request, 'mp-orders')
        if (guard) return guard
        return privateJson(await createPayment(body))
      }
      if (request.method === 'GET') {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
        const settings = await prisma.paymentSettings.findUnique({ where: { id: MERCHANT }, include: { account: true } })
        return privateJson({ provider: order.paymentProvider, ready: checkoutReady() && !!settings?.account?.access && !!settings.account.confirmedAt,
          publicKey: settings?.account?.access && settings.account.confirmedAt ? await publicKeyFor(settings.account.id) : '', payment: await paymentView(order.id), status: order.statusPagamento })
      }
    }
    return await admin(request)
  } catch { return privateJson({ error: 'Não foi possível concluir. Confira a integração e tente novamente com a mesma solicitação.' }, 400) }
}
export const GET = withModuleApi('/api/mercado-pago', handler)
export const POST = withModuleApi('/api/mercado-pago', handler)

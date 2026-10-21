import 'server-only'
import { z } from 'zod'
import { prisma } from '@/core/lib/prisma'
import { decrypt, encrypt, required } from './security'
import { money } from './accounting'

export const providerOrder = z.object({
  id: z.string().regex(/^ORD[A-Za-z0-9_-]{1,100}$/), user_id: z.union([z.string(), z.number()]).transform(String),
  external_reference: z.string(), total_amount: z.string(), country_code: z.literal('BRA'), currency_id: z.literal('BRL').optional(), status: z.string(), status_detail: z.string(),
  transactions: z.object({ payments: z.array(z.object({ amount: z.string(), paid_amount: z.string().optional(), refunded_amount: z.string().optional(),
    status_detail: z.string().optional(), payment_method: z.object({ qr_code: z.string().optional(), qr_code_base64: z.string().optional() }) })) }),
})
export type ProviderOrder = z.infer<typeof providerOrder>
export class MpHttpError extends Error {
  constructor(public readonly status: number) { super('Mercado Pago indisponível') }
}
export async function mp(path: string, token: string, method = 'GET', body?: unknown, key?: string) {
  const response = await fetch('https://api.mercadopago.com' + path, { method, cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(key ? { 'X-Idempotency-Key': key } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    // Never log provider bodies, account data, buyer data or credentials.
    console.error('Mercado Pago: falha HTTP', response.status)
    throw new MpHttpError(response.status)
  }
  return response.json()
}
const tokenSchema = z.object({ access_token: z.string(), refresh_token: z.string(), public_key: z.string().min(1), expires_in: z.number().positive(), user_id: z.number() })
export async function exchange(body: Record<string, string>) {
  return tokenSchema.parse(await mp('/oauth/token', '', 'POST', { client_id: required('MP_CLIENT_ID'), client_secret: required('MP_CLIENT_SECRET'),
    ...body, ...(body.grant_type === 'authorization_code' ? { test_token: false } : {}) }))
}
export async function verifySeller(access: string, expectedId?: string) {
  const user = z.object({ id: z.number(), tags: z.array(z.string()), site_id: z.literal('MLB'), nickname: z.string().optional() }).parse(await mp('/users/me', access))
  const id = String(user.id), test = user.tags.includes('test_user')
  if ((expectedId && id !== expectedId) || access.startsWith('TEST-')) throw new Error('Conta divergente')
  if (process.env.MP_ENVIRONMENT === 'test') {
    if (!test || !required('MP_TEST_SELLER_IDS').split(',').map(s => s.trim()).includes(id)) throw new Error('Somente conta de teste autorizada')
  } else if (process.env.MP_ENVIRONMENT !== 'live' || test) throw new Error('Ambiente ou conta inválidos')
  return { id, label: user.nickname ?? `Conta ${id}` }
}
export async function accessFor(accountId: string) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mp-account:${accountId}`}))`
    const account = await tx.mercadoPagoAccount.findUniqueOrThrow({ where: { id: accountId } })
    if (!account.access) throw new Error('Reconecte a conta Mercado Pago')
    let access = decrypt(account.access)
    if (!account.publicKey || !account.expiresAt || account.expiresAt.getTime() < Date.now() + 120000) {
      if (!account.refresh) throw new Error('Reconecte a conta Mercado Pago')
      const tokens = await exchange({ grant_type: 'refresh_token', refresh_token: decrypt(account.refresh) })
      if (String(tokens.user_id) !== account.userId) throw new Error('Conta OAuth divergente')
      access = tokens.access_token
      await tx.mercadoPagoAccount.update({ where: { id: accountId }, data: { publicKey: tokens.public_key, access: encrypt(access), refresh: encrypt(tokens.refresh_token), expiresAt: new Date(Date.now() + tokens.expires_in * 1000) } })
    }
    await verifySeller(access, account.userId)
    return access
  }, { timeout: 45000 })
}
export async function publicKeyFor(accountId: string) {
  let account = await prisma.mercadoPagoAccount.findUniqueOrThrow({ where: { id: accountId } })
  if (!account.access) throw new Error('Conta desconectada')
  if (!account.publicKey) {
    await accessFor(accountId)
    account = await prisma.mercadoPagoAccount.findUniqueOrThrow({ where: { id: accountId } })
  }
  if (!account.publicKey) throw new Error('Reconecte a conta Mercado Pago')
  return account.publicKey
}
export function orderPayload(reference: string, cents: number, email: string, method: 'pix' | 'card', card?: { token: string; payment_method_id: string; identification?: { type: string; number: string } }) {
  return { type: 'online', processing_mode: 'automatic', external_reference: reference, total_amount: money(cents),
    payer: { email, ...(method === 'pix' && process.env.MP_ENVIRONMENT === 'test' ? { first_name: 'APRO' } : {}), ...(card?.identification ? { identification: card.identification } : {}) },
    transactions: { payments: [{ amount: money(cents), payment_method: method === 'pix' ? { id: 'pix', type: 'bank_transfer' } : { id: card!.payment_method_id, type: 'credit_card', token: card!.token, installments: 1 } }] } }
}
export async function readOrder(id: string, token: string) {
  if (!/^ORD[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('ID inválido')
  return providerOrder.parse(await mp('/v1/orders/' + id, token))
}

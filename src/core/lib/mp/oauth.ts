import 'server-only'
import { createHash } from 'node:crypto'
import { prisma } from '@/core/lib/prisma'
import { AUTH_COOKIE_NAME } from '@/core/lib/auth-token'
import { readCookie } from '@/core/lib/request-security'
import { baseUrl, decrypt, encrypt, hash, MERCHANT, nonce, oauthReady, required } from './security'
import { exchange, verifySeller } from './client'
import { lock } from './ledger'

const callbackUrl = () => baseUrl() + '/api/mercado-pago/oauth/callback'
const sessionHash = (request: Request) => hash(JSON.stringify([MERCHANT, baseUrl(), requiredCookie(request)]))
function requiredCookie(request: Request) {
  const cookie = readCookie(request.headers.get('cookie'), AUTH_COOKIE_NAME)
  if (!cookie) throw new Error('Sessão ausente')
  return cookie
}
// Routes additionally require the existing authenticated administrator.
export async function startOAuth(request: Request) {
  if (!oauthReady()) throw new Error('OAuth não configurado')
  const state = nonce(), verifier = nonce()
  await prisma.mercadoPagoOAuthAttempt.create({ data: { hash: hash(state), sessionHash: sessionHash(request), verifier: encrypt(verifier), expiresAt: new Date(Date.now() + 600000) } })
  const url = new URL('https://auth.mercadopago.com.br/authorization')
  url.search = new URLSearchParams({ client_id: required('MP_CLIENT_ID'), response_type: 'code', platform_id: 'mp', redirect_uri: callbackUrl(), state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString()
  return new Response(null, { status: 303, headers: { Location: url.toString() } })
}
export async function finishOAuth(request: Request) {
  const url = new URL(request.url), state = url.searchParams.get('state') ?? '', code = url.searchParams.get('code')
  if (!oauthReady() || !code || !/^[A-Za-z0-9_-]{43}$/.test(state) || url.searchParams.has('error')) throw new Error('Autorização inválida')
  const attempt = await prisma.mercadoPagoOAuthAttempt.findUniqueOrThrow({ where: { hash: hash(state) } })
  const consumed = await prisma.mercadoPagoOAuthAttempt.deleteMany({ where: { hash: hash(state), sessionHash: sessionHash(request), expiresAt: { gt: new Date() } } })
  if (consumed.count !== 1) throw new Error('Autorização expirada ou reutilizada')
  const tokens = await exchange({ grant_type: 'authorization_code', code, redirect_uri: callbackUrl(), code_verifier: decrypt(attempt.verifier) })
  const user = await verifySeller(tokens.access_token, String(tokens.user_id))
  await prisma.$transaction(async tx => {
    await lock(tx, MERCHANT)
    const account = await tx.mercadoPagoAccount.upsert({ where: { userId: user.id },
      create: { userId: user.id, label: user.label, publicKey: tokens.public_key, access: encrypt(tokens.access_token), refresh: encrypt(tokens.refresh_token), expiresAt: new Date(Date.now() + tokens.expires_in * 1000) },
      update: { label: user.label, publicKey: tokens.public_key, access: encrypt(tokens.access_token), refresh: encrypt(tokens.refresh_token), expiresAt: new Date(Date.now() + tokens.expires_in * 1000), confirmedAt: null } })
    // New accounts affect future attempts; every existing attempt retains its accountId.
    await tx.paymentSettings.upsert({ where: { id: MERCHANT }, create: { id: MERCHANT, accountId: account.id }, update: { accountId: account.id } })
  })
  return new Response(null, { status: 303, headers: { Location: baseUrl() + '/admin/configuracoes/pagamentos' } })
}
export async function disconnectAccount() {
  await prisma.$transaction(async tx => {
    await lock(tx, MERCHANT)
    const settings = await tx.paymentSettings.findUnique({ where: { id: MERCHANT } })
    if (settings?.accountId) {
      await lock(tx, `mp-account:${settings.accountId}`)
      await tx.mercadoPagoAccount.update({ where: { id: settings.accountId }, data: { access: null, refresh: null, publicKey: null, expiresAt: null, confirmedAt: null } })
    }
    await tx.mercadoPagoOAuthAttempt.deleteMany({})
  })
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { isModuleEnabled } from '@/core/lib/modules'
export const MERCHANT = process.env.MP_INSTANCE_ID ?? 'unconfigured'
export const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export const nonce = () => randomBytes(32).toString('base64url')
export function required(name: string) {
  const value = process.env[name]
  if (!value || value === 'NOT_CONFIGURED') throw new Error('Integração não configurada')
  return value
}
function key() {
  const value = Buffer.from(required('MP_TOKEN_ENCRYPTION_KEY'), 'base64')
  if (value.length !== 32) throw new Error('Chave de criptografia inválida')
  return value
}
// Each installation uses its own key and authenticated instance context.
export function encrypt(text: string) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(MERCHANT))
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}
export function decrypt(text: string) {
  const data = Buffer.from(text, 'base64')
  const cipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12))
  cipher.setAAD(Buffer.from(MERCHANT))
  cipher.setAuthTag(data.subarray(12, 28))
  return Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8')
}
export function baseUrl() {
  const url = new URL(required('MP_BASE_URL'))
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw new Error('URL inválida')
  return url.origin
}
export function oauthReady() {
  return isModuleEnabled('checkout') && /^[a-z0-9_-]{3,80}$/.test(MERCHANT) && MERCHANT !== 'unconfigured' && ['MP_INSTANCE_ID', 'MP_CLIENT_ID', 'MP_CLIENT_SECRET', 'MP_TOKEN_ENCRYPTION_KEY', 'MP_BASE_URL']
    .every(name => !!process.env[name] && process.env[name] !== 'NOT_CONFIGURED') && ['test', 'live'].includes(process.env.MP_ENVIRONMENT ?? '')
}
export function checkoutReady() {
  return oauthReady() && process.env.MP_PAYMENTS_ENABLED === 'true' &&
    !!process.env.MP_WEBHOOK_SECRET && process.env.MP_WEBHOOK_CONFIGURED === 'true'
}

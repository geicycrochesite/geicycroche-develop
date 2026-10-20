import 'server-only'
import type { Prisma } from '@/generated/client'
import { checkoutReady, MERCHANT } from './security'
export async function selectedProvider(tx: Prisma.TransactionClient) {
  if (!process.env.MP_INSTANCE_ID) return 'asaas'
  const settings = await tx.paymentSettings.findUnique({ where: { id: MERCHANT }, include: { account: true } })
  if (settings?.provider !== 'mercado_pago') return 'asaas'
  if (!checkoutReady() || !settings.account?.access || !settings.account.confirmedAt) throw new Error('Mercado Pago indisponível')
  return 'mercado_pago'
}

// Pure accounting rules ported from the Lab; no Lab pricing or runtime modes.
export const COMMISSION_CENTS = 100
export const money = (cents: number) => (cents / 100).toFixed(2)
export function centsFromMoney(value: string) {
  if (!/^\d+\.\d{2}$/.test(value)) throw new Error('Valor inválido')
  const [whole, fraction] = value.split('.')
  const result = Number(whole) * 100 + Number(fraction)
  if (!Number.isSafeInteger(result)) throw new Error('Valor fora do limite')
  return result
}
export function financialState(status: string, detail: string) {
  if (status === 'refunded' || status === 'charged_back' || detail === 'partially_refunded') return 'reversed'
  if (status === 'processed' && detail === 'accredited') return 'paid'
  return 'unpaid'
}
export function weekStart(now = new Date()) {
  const local = new Date(now.getTime() - 3 * 3600000)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (local.getUTCDay() + 6) % 7, 3))
}
export function totals(entries: { cents: number; salesCents: number; refundCents: number; kind: string }[], credit: number) {
  const feesCents = entries.filter(e => e.kind === 'commission').reduce((n, e) => n + e.cents, 0)
  const adjustments = entries.filter(e => e.kind !== 'commission').reduce((n, e) => n + e.cents, 0)
  const balance = feesCents + adjustments + credit
  return { salesCents: entries.reduce((n, e) => n + e.salesCents, 0), refundCents: entries.reduce((n, e) => n + e.refundCents, 0),
    feesCents, adjustments, openingCredit: credit, dueCents: Math.max(balance, 0), closingCredit: Math.min(balance, 0) }
}

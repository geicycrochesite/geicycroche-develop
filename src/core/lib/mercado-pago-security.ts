export { verifyMercadoPagoWebhook as validateMercadoPagoSignature } from './commerce-security'

export async function fetchMercadoPagoPayment(
  paymentId: string,
  accessToken: string | undefined
) {
  if (!accessToken) {
    console.error('[MP-API] MERCADO_PAGO_ACCESS_TOKEN não configurado')
    return null
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      console.error(
        `[MP-API] Erro ao buscar pagamento: ${response.status} ${response.statusText}`
      )
      return null
    }

    const payment = await response.json()
    return payment
  } catch (error) {
    console.error('[MP-API] Erro ao buscar pagamento:', error)
    return null
  }
}

export type MercadoPagoPaymentStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'disputed'

export interface MercadoPagoPayment {
  id: number
  status: MercadoPagoPaymentStatus
  external_reference: string
  transaction_amount: number
  currency_id: string
  payer: {
    email: string
    identification: {
      type: string
      number: string
    }
  }
  description: string
  created_at: string
}
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import PaymentMethodSelector from './PaymentMethodSelector'
import CopyPixButton from './CopyPixButton'

type CardData = { token: string; payment_method_id: string; payer?: { identification?: { type: string; number: string } } }
type Brick = { unmount(): void }
type SDK = { bricks(): { create(kind: string, container: string, settings: {
  initialization: { amount: number; payer: { email: string } };
  customization: { visual: { style: { theme: 'dark'; customVariables: Record<string, string> } }; paymentMethods: { types: { included: string[] }; minInstallments: number; maxInstallments: number } };
  callbacks: { onReady(): void; onError(): void; onSubmit(data: CardData): Promise<void> }
}): Promise<Brick> } }
declare global { interface Window { MercadoPago?: new (key: string, options: { locale: string }) => SDK } }
type View = { id: string; status: string; detail: string; method: string; qrCode: string | null; qrImage: string | null }
type Setup = { ready: boolean; publicKey: string; payment: View | null; status: string }
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/mercado-pago/' + path, { cache: 'no-store', method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'Pagamento indisponível')
  return result
}
export default function MercadoPagoPayment({ orderId, total, email }: { orderId: string; total: number; email: string }) {
  const [setup, setSetup] = useState<Setup>(), [method, setMethod] = useState<'PIX' | 'CREDIT_CARD' | null>(null)
  const [sdkReady, setSdkReady] = useState(false), [cardReady, setCardReady] = useState(false)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const payload = useRef<unknown>(null), sending = useRef(false)
  const ignoredTerminal = useRef<string | null>(null)
  useEffect(() => {
    let active = true, polling = false
    const load = async () => {
      if (polling) return
      polling = true
      try { const value = await api<Setup>(`payment?orderId=${encodeURIComponent(orderId)}`); if (active) setSetup(value.payment?.id === ignoredTerminal.current ? { ...value, payment: null } : value) }
      catch (e) { if (active) setError((e as Error).message) }
      finally { polling = false }
    }
    void load()
    const timer = setInterval(load, 2500)
    return () => { active = false; clearInterval(timer) }
  }, [orderId])
  const submit = useCallback(async (card?: CardData) => {
    if (sending.current) return
    sending.current = true; setBusy(true); setError('')
    try {
      payload.current ??= { orderId, requestKey: crypto.randomUUID(), method: card ? 'card' : 'pix',
        ...(card ? { token: card.token, payment_method_id: card.payment_method_id, ...(card.payer?.identification ? { identification: card.payer.identification } : {}) } : {}) }
      const payment = await api<View>('payment', payload.current)
      setSetup(current => current ? { ...current, payment } : current)
    } catch (e) { setError((e as Error).message); throw e }
    finally { sending.current = false; setBusy(false) }
  }, [orderId])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const payment = setup?.payment
  const terminal = payment && ['failed', 'canceled', 'cancelled'].includes(payment.status)
  const showForm = !!setup?.ready && !payment
  useEffect(() => {
    if (!sdkReady || !setup?.publicKey || !showForm || method !== 'CREDIT_CARD') return
    let brick: Brick | undefined, cancelled = false
    const sdk = new window.MercadoPago!(setup.publicKey, { locale: 'pt-BR' })
    sdk.bricks().create('cardPayment', 'upnode-mp-card', {
      initialization: { amount: total, payer: { email } },
      customization: { visual: { style: { theme: 'dark', customVariables: { textPrimaryColor: '#FFFFFF', textSecondaryColor: '#FFFFFF', buttonTextColor: '#FFFFFF', formBackgroundColor: '#0C1F2B', inputBackgroundColor: '#0A2230' } } }, paymentMethods: { types: { included: ['credit_card'] }, minInstallments: 1, maxInstallments: 1 } },
      callbacks: { onReady: () => { if (!cancelled) setCardReady(true) }, onError: () => { if (!cancelled) setError('Não foi possível carregar o cartão.') }, onSubmit: data => submitRef.current(data) },
    }).then(value => { if (cancelled) value.unmount(); else brick = value }).catch(() => { if (!cancelled) setError('Falha ao carregar o cartão.') })
    return () => { cancelled = true; brick?.unmount() }
  }, [sdkReady, setup?.publicKey, showForm, method, total, email])
  return <div className="space-y-5">
    <p>Pagamento seguro pelo Mercado Pago</p>
    {setup?.publicKey && <Script src="https://sdk.mercadopago.com/js/v2" onReady={() => setSdkReady(true)} onError={() => setError('Falha ao carregar o formulário seguro. Atualize a página.')} />}
    {setup && !setup.ready && !payment && <p role="status">Pagamento temporariamente indisponível. A loja precisa conferir a conexão Mercado Pago.</p>}
    {showForm && <><PaymentMethodSelector cardInstallments={1} isLoading={busy} selectedMethod={method} onMethodSelect={value => { if (!busy) { setMethod(value as 'PIX' | 'CREDIT_CARD'); setCardReady(false); setError(''); payload.current = null } }} />
      {method === 'PIX' && <button disabled={busy} className="w-full rounded-2xl bg-[var(--color-accent)] text-white py-3" onClick={() => { void submit().catch(() => {}) }}>{busy ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}</button>}
      {method === 'CREDIT_CARD' && <>{!cardReady && <p role="status">Carregando formulário seguro de cartão…</p>}<div id="upnode-mp-card" /><p>Cartão em uma parcela. Dados tratados pelo formulário oficial do Mercado Pago.</p></>}
    </>}
    {payment && <div role="status" aria-live="polite">
      <p>{setup?.status === 'approved' ? 'Pagamento aprovado!' : setup?.status === 'refunded' ? 'Pagamento estornado' : setup?.status === 'disputed' ? 'Pagamento em contestação' : terminal ? 'Pagamento não aprovado' : 'Aguardando confirmação do pagamento'}</p>
      {terminal && payment.detail === 'invalid_card_token' && <p>Não foi possível validar o cartão. Clique em tentar novo pagamento e preencha os dados novamente para gerar uma nova autorização.</p>}
      {payment.status === 'action_required' && payment.detail === 'waiting_transfer' && <div className="space-y-3">
        {/* Provider-generated data URI; never sends card data to the servidor da loja. */}
        {payment.qrImage && <img alt="QR Code PIX" src={`data:image/png;base64,${payment.qrImage}`} className="w-56 h-56 bg-white p-3" />}
        <label className="block">PIX copia e cola<textarea readOnly value={payment.qrCode ?? ''} className="w-full border rounded p-2" /></label>
        <CopyPixButton code={payment.qrCode} />
      </div>}
      {terminal && <button onClick={() => { ignoredTerminal.current = payment.id; payload.current = null; setCardReady(false); setSetup(current => current ? { ...current, payment: null } : current) }}>Tentar novo pagamento</button>}
    </div>}
    {error && <p role="alert" className="text-[var(--color-error)]">{error}</p>}
  </div>
}

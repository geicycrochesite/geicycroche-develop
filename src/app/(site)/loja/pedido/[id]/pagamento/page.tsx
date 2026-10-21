'use client'
import MercadoPagoPayment from '@/core/components/payment/MercadoPagoPayment'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import PaymentMethodSelector from '@/core/components/payment/PaymentMethodSelector'
import CreditCardForm from '@/core/components/payment/CreditCardForm'
import PixPayment from '@/core/components/payment/PixPayment'
import { Loader2 } from 'lucide-react'

interface Order {
  paymentProvider?: string
  id: string
  total: number
  frete: number
  customerId?: string | null
  fullName: string
  email: string
  cpf: string
  phone: string
  address: any
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface CreditCardFormData {
  creditCardNumber: string
  creditCardHolderName: string
  creditCardExpirationMonth: string
  creditCardExpirationYear: string
  creditCardCvv: string
}

export default function PagamentoPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  // Buscar dados do pedido
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Pedido não encontrado')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error('Pedido não encontrado')

        const data = await res.json()
        setOrder(data)
      } catch (err) {
        console.error('Erro ao buscar pedido:', err)
        setError('Erro ao carregar pedido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  // Criar cliente Asaas se não existir
  const createCustomerIfNeeded = async (orderData: Order) => {
    if (orderData.customerId) {
      return orderData.customerId
    }

    try {
      const cpfClean = orderData.cpf.replace(/\D/g, '')
      const phoneClean = orderData.phone.replace(/\D/g, '')

      const res = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderData.fullName,
          email: orderData.email,
          cpf: cpfClean,
          phone: phoneClean,
          address: orderData.address,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar cliente')
      }

      const { customerId } = await res.json()

      // Atualizar o pedido com o customerId
      await fetch(`/api/orders/${orderData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      setOrder({ ...orderData, customerId })
      return customerId
    } catch (err) {
      console.error('Erro ao criar cliente:', err)
      throw err
    }
  }

  // Manipulador de pagamento com cartão
  const handleCreditCardSubmit = async (data: CreditCardFormData) => {
    if (!order) return

    setIsProcessing(true)
    try {
      const customerId = await createCustomerIfNeeded(order)
      const totalCents = Math.round(Number(order.total) * 100) / 100

      const paymentRes = await fetch('/api/asaas/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderId: order.id,
          total: totalCents,
          billingType: 'CREDIT_CARD',
          creditCardData: {
            creditCardNumber: data.creditCardNumber.replace(/\s/g, ''),
            creditCardHolderName: data.creditCardHolderName.toUpperCase(),
            creditCardExpirationMonth: data.creditCardExpirationMonth,
            creditCardExpirationYear: data.creditCardExpirationYear,
            creditCardCvv: data.creditCardCvv,
          },
        }),
      })

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json()
        throw new Error(errorData.error || 'Erro ao processar pagamento')
      }

      const paymentData = await paymentRes.json()
      
      if (paymentData.payment.status === 'CONFIRMED') {
        toast.success('Pagamento aprovado!')
        router.push(`/loja/pedido/${order.id}?status=approved&payment_id=${paymentData.paymentId}`)
      } else {
        toast.success('Pagamento enviado para análise')
        setPaymentId(paymentData.paymentId)
      }
    } catch (err: any) {
      console.error('Erro no pagamento:', err)
      toast.error(err.message || 'Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  // Manipulador de pagamento com PIX
  const handlePixPayment = async () => {
    if (!order) return

    setIsProcessing(true)
    try {
      const customerId = await createCustomerIfNeeded(order)
      const totalCents = Math.round(Number(order.total) * 100) / 100

      const paymentRes = await fetch('/api/asaas/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderId: order.id,
          total: totalCents,
          billingType: 'PIX',
          dueDate: new Date(Date.now() + 30 * 60000).toISOString().split('T')[0],
        }),
      })

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json()
        throw new Error(errorData.error || 'Erro ao criar cobrança PIX')
      }

      const paymentData = await paymentRes.json()
      setPaymentId(paymentData.paymentId)
      toast.success('QR Code PIX gerado!')
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err)
      toast.error(err.message || 'Erro ao gerar PIX')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <a href="/loja/meus-pedidos" className="text-[var(--color-accent)] hover:underline mb-4 inline-block">
          ← Voltar aos meus pedidos
        </a>
        <div className="p-4 border border-red-300 rounded-lg bg-red-50 text-red-700">
          {error || 'Pedido não encontrado'}
        </div>
      </main>
    )
  }

  const totalProdutos = order.items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
  const totalGeral = totalProdutos + Number(order.frete)

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <a href={`/loja/pedido/${orderId}`} className="text-[var(--color-accent)] hover:underline mb-4 inline-block">
        ← Voltar ao pedido
      </a>

      <div className="grid md:grid-cols-3 gap-6">
        {/* FORMULÁRIO DE PAGAMENTO */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <h1 className="text-2xl font-bold mb-6">Pagamento do Pedido</h1>

            {order.paymentProvider === 'mercado_pago' ? <MercadoPagoPayment orderId={order.id} total={Number(order.total) + Number(order.frete)} email={order.email} /> : <>
            {/* SELETOR DE MÉTODO */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodSelect={(method) => setPaymentMethod(method as 'CREDIT_CARD' | 'PIX')}
            />

            {/* FORMULÁRIO ESPECÍFICO DO MÉTODO */}
            <div className="mt-8">
              {paymentMethod === 'CREDIT_CARD' && (
                <CreditCardForm
                  onSubmit={handleCreditCardSubmit}
                  isLoading={isProcessing}
                  total={totalGeral}
                />
              )}

              {paymentMethod === 'PIX' && !paymentId && (
                <button
                  onClick={handlePixPayment}
                  disabled={isProcessing}
                  className="w-full rounded-2xl bg-[var(--color-accent)] text-white font-semibold py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isProcessing ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                </button>
              )}

              {paymentMethod === 'PIX' && paymentId && (
                <PixPayment
                  paymentId={paymentId}
                  total={totalGeral}
                />
              )}
            </div>
            </>}
          </div>
        </div>

        {/* RESUMO DO PEDIDO */}
        <div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 sticky top-20">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>

            <div className="space-y-3 text-sm">
              {/* ITEMS */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr className="border-[var(--color-border)]" />

              {/* TOTAIS */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Subtotal:</span>
                  <span className="text-[var(--color-text-primary)] font-medium">R$ {Number(totalProdutos.toFixed(2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Frete:</span>
                  <span className="text-[var(--color-text-primary)] font-medium">R$ {Number(order.frete).toFixed(2)}</span>
                </div>
              </div>

              <hr className="border-[var(--color-border)]" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-[var(--color-accent)]">R$ {Number(totalGeral.toFixed(2))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

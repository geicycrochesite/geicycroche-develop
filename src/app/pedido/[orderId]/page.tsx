'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { useCart } from '@/core/context/CartContext'

interface Order {
  id: string
  fullName: string
  email: string
  total: number
  frete: number
  statusPagamento: string
  items: Array<{
    name: string
    quantity: number
    price: number
    size: string
    color: string
  }>
}

export default function PedidoPage() {
  const params = useParams<{ orderId: string }>()
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/find?orderId=${params.orderId}`)
        if (!res.ok) {
          throw new Error('Pedido não encontrado')
        }
        const data = await res.json()
        setOrder(data)
        if (status === 'success') {
          clearCart()
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderId, status, clearCart])

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  if (!order) return <div>Pedido não encontrado</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pedido #{order.id}</h1>
      <p><strong>Nome:</strong> {order.fullName}</p>
      <p><strong>Email:</strong> {order.email}</p>
      <p><strong>Status do Pagamento:</strong> {order.statusPagamento}</p>
      <p><strong>Total:</strong> R$ {(order.total + order.frete).toFixed(2)}</p>

      <h2 className="text-xl font-semibold mt-4">Itens:</h2>
      <ul>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.name} - Quantidade: {item.quantity} - Preço: R$ {item.price.toFixed(2)} - Tamanho: {item.size} - Cor: {item.color}
          </li>
        ))}
      </ul>

      {status === 'success' && <p className="text-green-600 mt-4">Pagamento aprovado! Seu pedido está sendo processado.</p>}
      {status === 'failure' && <p className="text-red-600 mt-4">Pagamento falhou. Tente novamente.</p>}
      {status === 'pending' && <p className="text-yellow-600 mt-4">Pagamento pendente. Aguarde confirmação.</p>}
    </div>
  )
}
import { selectedProvider } from '@/core/lib/mp/provider'
import { withModuleApi } from '@/core/lib/module-server'
import { checkoutSchema } from '@/core/lib/validators/checkoutSchema'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/core/lib/prisma'
import { Prisma } from '@/generated/client'
import { withAdmin } from '@/core/lib/admin-access'
import { grantOrderAccess } from '@/core/lib/order-access'
import { mutationGuard, privateJson } from '@/core/lib/request-security'
import { verifyShippingQuote } from '@/core/lib/commerce-security'
import { ValidationError } from 'yup'

const GET = withAdmin(async function GET() {
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } })
  return privateJson(orders)
})

type CartItem = { productId: string; quantity: number; size: { name: string }; color: { name: string } }
function validItem(item: CartItem): boolean {
  return !!item && typeof item.productId === 'string' && item.productId.length <= 128 &&
    Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
    typeof item.size?.name === 'string' && typeof item.color?.name === 'string'
}

async function POST(req: NextRequest) {
  const guard = mutationGuard(req, 'checkout')
  if (guard) return guard
  if (!process.env.AUTH_JWT_SECRET) return privateJson({ error: 'Checkout indisponível.' }, 503)
  try {
    const body = await req.json()
    const items: CartItem[] = body.items
    if (!Array.isArray(items) || items.length === 0 || items.length > 100 || !items.every(validItem))
      return privateJson({ error: 'Itens ou quantidades inválidos.' }, 400)
    const customer = await checkoutSchema.validate(body, { abortEarly: false, stripUnknown: true })
    const quantities = new Map<string, number>()
    for (const item of items) {
      const quantity = (quantities.get(item.productId) || 0) + item.quantity
      if (!Number.isSafeInteger(quantity)) return privateJson({ error: 'Quantidade inválida.' }, 400)
      quantities.set(item.productId, quantity)
    }
    const quantity = [...quantities.values()].reduce((sum, value) => sum + value, 0)
    const frete = verifyShippingQuote(body.quoteToken, customer.address.zipCode, quantity, body.frete)
    const order = await prisma.$transaction(async tx => {
      const paymentProvider = await selectedProvider(tx)
      const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] } }, include: { colors: true, sizes: true } })
      if (products.length !== quantities.size) throw new Error('Produto inválido.')
      // Conditional decrement is atomic in PostgreSQL, including repeated cart lines.
      for (const product of [...products].sort((a, b) => a.id.localeCompare(b.id))) {
        const reserved = await tx.product.updateMany({
          where: { id: product.id, price: product.price, stock: { gte: quantities.get(product.id)! } },
          data: { stock: { decrement: quantities.get(product.id)! } },
        })
        if (reserved.count !== 1) throw new Error('Estoque ou preço alterado. Revise o carrinho.')
      }
      let total = new Prisma.Decimal(0)
      const validatedItems = items.map(item => {
        const product = products.find(product => product.id === item.productId)!
        if ((product.colors.length && !product.colors.some(color => color.name === item.color.name)) ||
            (product.sizes.length && !product.sizes.some(size => size.name === item.size.name))) throw new Error('Variação inválida.')
        total = total.plus(product.price.mul(item.quantity))
        return { productId: product.id, name: product.name, quantity: item.quantity,
          price: product.price, size: item.size.name, color: item.color.name }
      })
      if (!total.isPositive()) throw new Error('Valor inválido.')
      return tx.order.create({ data: { ...customer, total, frete, paymentProvider, statusPagamento: 'pending', items: { create: validatedItems } } })
    })
    return grantOrderAccess(NextResponse.json({ success: true, orderId: order.id }), [order.id])
  } catch (error) {
    if (error instanceof ValidationError) return privateJson({ error: error.errors }, 400)
    return privateJson({ error: 'Não foi possível criar o pedido. Revise os itens e recalcule o frete.' }, 400)
  }
}

const moduleGET = withModuleApi('/api/orders', GET)
export { moduleGET as GET }

const modulePOST = withModuleApi('/api/orders', POST)
export { modulePOST as POST }

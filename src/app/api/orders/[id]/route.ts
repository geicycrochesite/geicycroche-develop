import { withModuleApi } from '@/core/lib/module-server'
import { prisma } from '@/core/lib/prisma'
import { canAccessOrder } from '@/core/lib/order-access'
import { asaasFetch } from '@/core/lib/asaas'
import { mutationGuard, privateJson } from '@/core/lib/request-security'

// Adapted from E&L. Customer/provider bindings are written by the server, never PATCH.
async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await canAccessOrder(id)) return privateJson({ error: 'Pedido não encontrado.' }, 404)
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  return order ? privateJson(order) : privateJson({ error: 'Pedido não encontrado.' }, 404)
}

// Financial fields are owned by verified providers. Customer bindings use create-customer.
async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = mutationGuard(request, 'legacy-customer-binding')
  if (guard) return guard
  const { id } = await params
  if (!await canAccessOrder(id)) return privateJson({ error: 'Pedido não encontrado.' }, 404)
  try {
    const body = await request.json()
    if (Object.keys(body).length !== 1 || typeof body.customerId !== 'string' || !/^cus_[a-zA-Z0-9_]{1,100}$/.test(body.customerId)) return privateJson({ error: 'Alteração não permitida.' }, 403)
    const order = await prisma.order.findUniqueOrThrow({ where: { id } })
    if (order.paymentProvider !== 'asaas') return privateJson({ error: 'Provedor divergente.' }, 403)
    const customer = await asaasFetch<{ id: string; email: string; cpfCnpj: string }>('/customers/' + body.customerId)
    if (customer.id !== body.customerId || customer.email?.trim().toLowerCase() !== order.email.trim().toLowerCase() || customer.cpfCnpj?.replace(/\D/g, '') !== order.cpf.replace(/\D/g, '')) return privateJson({ error: 'Cliente divergente.' }, 400)
    await prisma.order.update({ where: { id }, data: { customerId: customer.id } })
    return privateJson({ success: true })
  } catch { return privateJson({ error: 'Não foi possível vincular o cliente.' }, 400) }
}

const moduleGET = withModuleApi('/api/orders/[id]', GET)
export { moduleGET as GET }

const modulePATCH = withModuleApi('/api/orders/[id]', PATCH)
export { modulePATCH as PATCH }

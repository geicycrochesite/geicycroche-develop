import { withModuleApi } from '@/core/lib/module-server'
import { mutationGuard, privateJson } from '@/core/lib/request-security'
import { canAccessOrder, grantOrderAccess } from '@/core/lib/order-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/core/lib/prisma'

async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ message: 'orderId é obrigatório' }, { status: 400 })
  }

  if (!await canAccessOrder(orderId)) return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 })

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 })
    }

    return NextResponse.json(order, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ message: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

async function POST(req: Request) {
  const guard = mutationGuard(req, 'order-lookup')
  if (guard) return guard
  if (!process.env.AUTH_JWT_SECRET) return privateJson({ message: 'Consulta indisponível.' }, 503)
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const cpf = typeof body?.cpf === 'string' ? body.cpf.replace(/\D/g, '') : ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{11}$/.test(cpf)) {
    return NextResponse.json({ message: 'Email e CPF são obrigatórios' }, { status: 400 })
  }

  try {
    const pedidos = await prisma.order.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        cpf: { in: [cpf, cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')] },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        statusPagamento: true,
        total: true,
        createdAt: true,
      },
    })

    return grantOrderAccess(NextResponse.json(pedidos), pedidos.map(pedido => pedido.id), true,
      pedidos.length ? { email, cpf } : undefined)
  } catch {
    return NextResponse.json({ message: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}

const moduleGET = withModuleApi('/api/orders/find', GET)
export { moduleGET as GET }

const modulePOST = withModuleApi('/api/orders/find', POST)
export { modulePOST as POST }

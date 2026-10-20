import type { Prisma } from '@/generated/client'
import { withModuleApi } from '@/core/lib/module-server'
import { withAdmin } from '@/core/lib/admin-access'
import { NextResponse } from 'next/server'
import { prisma } from '@/core/lib/prisma'

const GET = withAdmin(async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  const page = Number(searchParams.get('page') || '1')
  const perPage = Number(searchParams.get('perPage') || '10')

  const where: Prisma.OrderWhereInput = {}

  if (status && status !== 'ALL') {
    where.statusPagamento = status
  }

  if (search) {
    where.fullName = { contains: search, mode: 'insensitive' }
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({ total, page, perPage, orders })
})

const moduleGET = withModuleApi('/api/admin/orders', GET)
export { moduleGET as GET }

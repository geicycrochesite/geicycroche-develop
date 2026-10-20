import CreateProductLink from '@/core/components/admin/CreateProductLink'
// src/app/(admin)/admin/page.tsx
import { prisma } from '@/core/lib/prisma'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { OrdersTable } from '@/core/components/admin/OrdersTable'
import { SalesChart } from '@/core/components/admin/SalesChart'

async function getDashboardData() {
  const from = subDays(new Date(), 29)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from } },
    orderBy: { createdAt: 'desc' },
  })

  const totalOrders = orders.length

  const faturamentoTotal = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  )

  const ticketMedio = totalOrders
    ? faturamentoTotal / totalOrders
    : 0

  const statusCounts = orders.reduce((acc, order) => {
    const status = order.statusPagamento || 'PENDENTE'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const allDates = eachDayOfInterval({ start: from, end: new Date() })

  const salesByDay = allDates.map((date) => {
    const value = orders
      .filter(
        (order) =>
          format(order.createdAt, 'yyyy-MM-dd') ===
          format(date, 'yyyy-MM-dd')
      )
      .reduce((sum, order) => sum + Number(order.total), 0)

    return {
      date: format(date, 'dd/MM'),
      value: Number(value.toFixed(2)),
    }
  })

  // 👇 GARANTE QUE SEMPRE É NUMBER
  const recentOrders = orders.slice(0, 10).map((order) => ({
    id: order.id,
    fullName: order.fullName,
    total: Number(order.total),
    statusPagamento: order.statusPagamento || 'PENDENTE',
    createdAt: order.createdAt,
  }))

  return {
    totalOrders,
    faturamentoTotal,
    ticketMedio,
    statusCounts,
    salesByDay,
    recentOrders,
  }
}

export default async function AdminPage() {
  const {
    totalOrders,
    faturamentoTotal,
    ticketMedio,
    statusCounts,
    salesByDay,
    recentOrders,
  } = await getDashboardData()

  return (
    <div className="space-y-6">
        <CreateProductLink />
      <div>
        <h2 className="text-2xl font-bold">Início</h2>
        <p className="text-[var(--color-text-secondary)]">
          Visão geral dos últimos 30 dias
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] p-4 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
            Total de pedidos
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-admin-text)]">
            {totalOrders}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] p-4 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
            Faturamento total
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-success)]">
            R${faturamentoTotal.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] p-4 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
            Ticket médio
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-info)]">
            R${ticketMedio.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] p-4 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
            Quantidade por status
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(statusCounts as Record<string, number>).map(([status, amount]) => (
              <span key={status}>
                {status}: {amount}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SalesChart data={salesByDay} />

      <OrdersTable orders={recentOrders} />
    </div>
  )
}
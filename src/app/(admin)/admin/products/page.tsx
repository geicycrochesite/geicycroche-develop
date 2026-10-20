import CreateProductLink from '@/core/components/admin/CreateProductLink'
// src/app/(admin)/admin/products/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/core/lib/prisma'
import DeleteProductButton from '@/core/components/admin/DeleteProductButton'

type ProductsPageProps = {
  searchParams: Promise<{ page?: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  const page = Math.max(1, Number(params?.page || '1') || 1)
  const perPage = 10

  const [total, products] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      include: { images: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Gerencie o catálogo de produtos, imagens, categorias e vídeo do YouTube.
          </p>
        </div>

        <CreateProductLink />
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] shadow-sm">
        <table className="min-w-full divide-y divide-[var(--color-admin-border)] text-sm">
          <thead className="bg-[var(--color-bg-tertiary)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Imagem</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Produto</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Preço</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Estoque</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border-light)] bg-[var(--color-admin-bg)]">
            {products.map((product) => {
              const thumbnail = product.images?.[0]?.url || ''

              return (
                <tr key={product.id} className="hover:bg-[var(--color-bg-hover)]">
                  <td className="px-4 py-3">
                    <div className="h-16 w-20 overflow-hidden rounded-2xl bg-[var(--color-bg-tertiary)]">
                      <Image
                        src={thumbnail}
                        alt={product.name}
                        width={120}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium text-[var(--color-admin-text)]">
                    {product.name}
                  </td>

                  <td className="px-4 py-3 text-[var(--color-admin-text)]">
                    R$ {Number(product.price).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-[var(--color-admin-text)]">
                    {product.stock}
                  </td>

                  <td className="px-4 py-3 space-x-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-2xl border border-[var(--color-admin-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-xs font-semibold text-[var(--color-admin-text)] transition hover:bg-[var(--color-bg-hover)]"
                    >
                      Editar
                    </Link>

                    <DeleteProductButton productId={product.id} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] px-4 py-3 shadow-sm">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Página {page} de {totalPages}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products?page=${Math.max(1, page - 1)}`}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              page === 1
                ? 'cursor-not-allowed bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            Anterior
          </Link>

          <Link
            href={`/admin/products?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              page >= totalPages
                ? 'cursor-not-allowed bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            Próximo
          </Link>
        </div>
      </div>
    </div>
  )
}
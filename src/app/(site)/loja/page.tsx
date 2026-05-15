import Link from 'next/link'
import { prisma } from '@/core/lib/prisma'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

async function getProducts() {
  return prisma.product.findMany({
    include: {
      colors: true,
      sizes: true,
      images: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
} 

export default async function LojaPage() {
  const products = await getProducts()

  if (!products.length) {
    return (
      <main>
        <section className="px-4 py-20 md:px-20 md:py-32 flex items-center justify-center">
          <div className="text-center max-w-xl">
            <h1
              className="text-2xl md:text-4xl font-bold"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              Lançamento da loja em breve
            </h1>

            <p
              className="mt-4 text-sm md:text-base"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              Estamos preparando tudo com carinho para trazer novidades para você.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <section className="px-4 py-6 md:px-20 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const image = product.images?.[0]?.url || '/placeholder.png'

          return (
            <Link
              key={product.id}
              href={`/loja/produto/${product.slug}`}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:scale-105 transition flex flex-col"
            >
              <div className="w-full aspect-square md:aspect-auto md:h-72 relative">
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-2 md:p-4 flex flex-col flex-1">
                <h2
                  className="text-sm md:text-xl font-semibold line-clamp-2"
                  style={{ color: 'var(--color-textPrimary)' }}
                >
                  {product.name}
                </h2>

                <p className="text-green-700 font-bold text-sm md:text-lg mt-1">
                  R$ {Number(product.price).toFixed(2)}
                </p>

                <button className="bg-green-600 w-full mt-auto py-1 md:py-2 rounded-lg text-xs md:text-sm font-bold text-white md:mt-3">
                  VER DETALHES
                </button>
              </div>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Limpando banco (modo seguro)...')

  // 🔥 limpa tudo relacionado a produto sem erro de FK
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "ProductImage",
      "ProductColor",
      "Size",
      "OrderItem",
      "Product",
      "Category"
    RESTART IDENTITY CASCADE;
  `)

  console.log('✅ Banco limpo!')

  // ─────────────────────────────────────────
  // 🛍️ CATEGORIAS
  // ─────────────────────────────────────────
  const [catRoupas, catBolsas, catCasa] = await Promise.all([
    prisma.category.create({
      data: { name: 'Roupas em Crochê', slug: 'roupas-croche' },
    }),
    prisma.category.create({
      data: { name: 'Bolsas em Crochê', slug: 'bolsas-croche' },
    }),
    prisma.category.create({
      data: { name: 'Itens para Casa', slug: 'itens-casa-croche' },
    }),
  ])

  // ─────────────────────────────────────────
  // 🛍️ PRODUTOS
  // ─────────────────────────────────────────
  const produtos = [

    // BOLSAS
    {
      name: 'Bolsa Kisslock em Crochê',
      slug: 'bolsa-kisslock-croche',
      categoryId: catBolsas.id,
      images: [
        '/produtos/Bolsa-Kisslock-Croche-01.png',
        '/produtos/Bolsa-Kisslock-Croche-02.png',
      ],
      description: 'Bolsa Kisslock em crochê artesanal com fecho metálico elegante. Ideal para looks sofisticados com toque handmade.',
    },
    {
      name: 'Bolsa Redonda em Crochê',
      slug: 'bolsa-redonda-croche',
      categoryId: catBolsas.id,
      images: [
        '/produtos/Bolsa-Redonda-Croche-01.png',
        '/produtos/Bolsa-Redonda-Croche-02.png',
      ],
      description: 'Bolsa redonda em crochê leve e estilosa, perfeita para compor looks modernos.',
    },
    {
      name: 'Bolsa Quadradinhos Mescla',
      slug: 'bolsa-quadradinhos-mescla',
      categoryId: catBolsas.id,
      images: [
        '/produtos/Bolsa-Shopper-Square-Bolsa-Quadradinhos-da-Vovo-Mescla-01.png',
        '/produtos/Bolsa-Shopper-Square-Bolsa-Quadradinhos-da-Vovo-Mescla-02.png',
      ],
      description: 'Bolsa em crochê estilo granny square com cores mescladas e acabamento artesanal.',
    },
    {
      name: 'Bolsa Quadradinhos Terrosos',
      slug: 'bolsa-quadradinhos-terrosos',
      categoryId: catBolsas.id,
      images: [
        '/produtos/Bolsa-Shopper-Square-Bolsa-Quadradinhos-da-Vovo-Mescla-Tons-Terrosos-01.png',
        '/produtos/Bolsa-Shopper-Square-Bolsa-Quadradinhos-da-Vovo-Mescla-Tons-Terrosos-02.png',
      ],
      description: 'Bolsa em crochê com tons terrosos elegante e versátil.',
    },
    {
      name: 'Bolsa Tote em Crochê',
      slug: 'bolsa-tote-croche',
      categoryId: catBolsas.id,
      images: [
        '/produtos/Bolsa-Shopper-Tote-01.png',
        '/produtos/Bolsa-Shopper-Tote-02.png',
      ],
      description: 'Bolsa tote em crochê espaçosa e resistente para o dia a dia.',
    },

    // ROUPAS
    {
      name: 'Cropped Diamante Crochê',
      slug: 'cropped-diamante',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Cropped-Diamante-Copa-do-Mundo-Vai-Brasil-01.png',
        '/produtos/Cropped-Diamante-Copa-do-Mundo-Vai-Brasil-02.png',
      ],
      description: 'Cropped em crochê com padrão diamante feito à mão.',
    },
    {
      name: 'Cropped Frente Única',
      slug: 'cropped-frente-unica',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Cropped-Fente-Unica-Copa-do-Mundo-Vai-Brasil-01.png',
        '/produtos/Cropped-Fente-Unica-Copa-do-Mundo-Vai-Brasil-02.png',
      ],
      description: 'Cropped frente única em crochê leve e moderno.',
    },
    {
      name: 'Cropped Quadradinhos',
      slug: 'cropped-quadradinhos',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Cropped-Quadradinhos-da-Vovo-Copa-do-Mundo-Vai-Brasil-01.png',
        '/produtos/Cropped-Quadradinhos-da-Vovo-Copa-do-Mundo-Vai-Brasil-02.png',
      ],
      description: 'Cropped estilo granny square com design retrô.',
    },
    {
      name: 'Cropped Tomara que Caia',
      slug: 'cropped-tomara-que-caia',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Cropped-Tomara-que-caia-Copa-do-Mundo-Vai-Brasil-01.png',
        '/produtos/Cropped-Tomara-que-caia-Copa-do-Mundo-Vai-Brasil-02.png',
        '/produtos/Cropped-Tomara-que-caia-Copa-do-Mundo-Vai-Brasil-03.png',
      ],
      description: 'Cropped tomara que caia elegante em crochê.',
    },
    {
      name: 'Saída de Praia Crochê',
      slug: 'saida-praia',
      categoryId: catRoupas.id,
      images: ['/produtos/Saida-de-paia-de-croche-musa.png'],
      description: 'Saída de praia em crochê leve e sofisticada.',
    },
    {
      name: 'Top Cortininha',
      slug: 'top-cortininha',
      categoryId: catRoupas.id,
      images: ['/produtos/Top-de-croche-cortininha.png'],
      description: 'Top cortininha em crochê ideal para verão.',
    },
    {
      name: 'Top Franja',
      slug: 'top-franja',
      categoryId: catRoupas.id,
      images: ['/produtos/Top-de-croche-franja.png'],
      description: 'Top em crochê com franja estilo boho.',
    },
    {
      name: 'Top Borboleta',
      slug: 'top-borboleta',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Top-de-croche-frente-unica-borboleta-mescla.png',
        '/produtos/Top-de-croche-frente-unica-borboleta-roxa.png',
      ],
      description: 'Top crochê formato borboleta exclusivo.',
    },
    {
      name: 'Top Frente Única',
      slug: 'top-frente-unica',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Top-de-croche-frente-unica-grafite.png',
        '/produtos/Top-de-croche-frente-unica-vermelho.png',
      ],
      description: 'Top frente única moderno em crochê.',
    },
    {
      name: 'Top Versátil',
      slug: 'top-versatil',
      categoryId: catRoupas.id,
      images: [
        '/produtos/Top-de-croche-versatil-01.png',
        '/produtos/Top-de-croche-versatil-02.png',
      ],
      description: 'Top versátil em crochê com múltiplas formas de uso.',
    },
    {
      name: 'Top Diamante Mesclado',
      slug: 'top-diamante-mesclado',
      categoryId: catRoupas.id,
      images: ['/produtos/top-de-croche-diamente-mesclado.png'],
      description: 'Top crochê com padrão diamante mesclado.',
    },

    // CASA
    {
      name: 'Tapete Azul Crochê',
      slug: 'tapete-azul',
      categoryId: catCasa.id,
      images: ['/produtos/Tapete-Passadeira-de-croche-azul-preto-e-cru.png'],
      description: 'Tapete passadeira azul em crochê artesanal.',
    },
    {
      name: 'Tapete Marrom Crochê',
      slug: 'tapete-marrom',
      categoryId: catCasa.id,
      images: ['/produtos/Tapete-Passadeira-de-croche-marron-preto-e-cru.png'],
      description: 'Tapete artesanal marrom em crochê.',
    },
    {
      name: 'Tapete Rosa Crochê',
      slug: 'tapete-rosa',
      categoryId: catCasa.id,
      images: ['/produtos/Tapete-Passadeira-de-croche-rosa-preto-e-cru.png'],
      description: 'Tapete passadeira rosa em crochê.',
    },
    {
      name: 'Tapete Verde Crochê',
      slug: 'tapete-verde',
      categoryId: catCasa.id,
      images: ['/produtos/Tapete-Passadeira-de-croche-verde-preto-e-cru.png'],
      description: 'Tapete verde em crochê para decoração.',
    },
  ]

  for (const p of produtos) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: 100.0,
        stock: 10,
        handmade: true,
        categories: {
          connect: [{ id: p.categoryId }],
        },
        images: {
          create: p.images.map((url) => ({ url })),
        },
      },
    })
  }

  console.log('🎉 Seed finalizado com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
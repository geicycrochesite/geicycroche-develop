import { prisma } from '../src/core/lib/prisma'
import { hash } from 'bcryptjs'
if (process.env.UPNODE_MP_ISOLATED_TEST !== 'yes' || !/@127\.0\.0\.1:\d+\/upnode_mp_/.test(process.env.DATABASE_URL ?? '')) throw Error('Isolated test only')
async function main() {
  await prisma.adminUser.create({ data: { email: 'admin@synthetic.invalid', passwordHash: await hash('synthetic-test-password', 10), role: 'admin' } })
  await prisma.product.create({ data: { id: 'synthetic-product', slug: 'synthetic-product', name: 'Produto Sintético', description: 'Teste local', price: '20.00', stock: 10 } })
  const category = await prisma.category.upsert({ where: { slug: 'produto-digital' }, create: { name: 'Produto digital (sem frete)', slug: 'produto-digital' }, update: {} })
  await prisma.product.create({ data: { id: 'synthetic-digital', slug: 'synthetic-digital', name: 'Produto Digital Sintético', description: 'Teste digital local', price: '10.00', stock: 10, categories: { connect: { id: category.id } } } })
}
main().finally(() => prisma.$disconnect())

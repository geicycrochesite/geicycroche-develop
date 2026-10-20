import { PrismaClient } from '@/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  })
  // Explicit schema is necessary with adapter-pg (used by isolated PostgreSQL tests).
  const schema = new URL(process.env.DATABASE_URL!).searchParams.get('schema') ?? undefined
  const adapter = new PrismaPg(pool, { schema, disposeExternalPool: true })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

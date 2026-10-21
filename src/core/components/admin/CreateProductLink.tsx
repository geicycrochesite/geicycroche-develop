import Link from 'next/link'
import { Plus } from 'lucide-react'
import { isPublicLinkEnabled } from '@/core/lib/modules'

export default function CreateProductLink() {
  if (!isPublicLinkEnabled('/admin/products/new')) return null
  return <Link href="/admin/products/new" className="inline-flex min-h-12 min-w-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-bg-hover)] px-5 py-3 text-sm font-semibold text-[var(--color-admin-text)] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-admin-text)]">
    <Plus aria-hidden="true" className="h-5 w-5" />Cadastrar produto
  </Link>
}

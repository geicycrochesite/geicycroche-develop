'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function AdminBackButton() {
  const pathname = usePathname()
  if (!pathname || pathname === '/admin' || pathname.startsWith('/admin/login') || pathname.startsWith('/admin/setup-admin')) return null
  const sections = ['/admin/products', '/admin/pedidos', '/admin/blog/categories', '/admin/blog/posts']
  const parent = sections.find(section => pathname.startsWith(section + '/'))
  const href = parent ?? '/admin'
  return <Link href={href} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-admin-border)] px-4 py-2 text-[var(--color-admin-text)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-admin-text)]">
    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
    {parent === '/admin/products' ? 'Voltar aos produtos' : parent === '/admin/pedidos' ? 'Voltar aos pedidos' : parent === '/admin/blog/categories' ? 'Voltar às categorias' : parent === '/admin/blog/posts' ? 'Voltar aos posts' : 'Voltar ao painel'}
  </Link>
}

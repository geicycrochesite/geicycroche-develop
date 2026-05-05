'use client'

import { useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/core/context/CartContext'
import { siteConfig } from '@/client/config/site.config'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { totalItems } = useCart()
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}`

  return (
    <header
      className="w-full fixed top-0 z-50 backdrop-blur"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 90%, transparent)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

        <Image
          src={siteConfig.logoHorizontal}
          alt={siteConfig.logoAlt}
          width={140}
          height={60}
        />

        {/* Desktop */}
        <nav
          className="hidden md:flex gap-8 text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {siteConfig.navLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
          <Link href="/loja/carrinho" className="inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Carrinho
            {totalItems > 0 && (
              <span
                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-2 text-[0.65rem] font-semibold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </nav>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block px-4 py-2 rounded transition"
          style={{
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)'
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.backgroundColor = 'var(--color-accent)'
            el.style.color = 'var(--color-bg-primary)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.backgroundColor = 'transparent'
            el.style.color = 'var(--color-accent)'
          }}
        >
          {siteConfig.headerCta}
        </a>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/loja"
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Loja
          </Link>
          <Link href="/loja/carrinho" className="relative">
            <ShoppingCart className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            {totalItems > 0 && (
              <span
                className="absolute -top-2 -right-2 h-4 min-w-[1rem] flex items-center justify-center rounded-full px-1 text-[0.6rem] font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
              >
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          {siteConfig.mobileNavLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
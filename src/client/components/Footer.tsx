'use client'

import Link from "next/link"
import Image from "next/image"
import { Settings } from "lucide-react"
import { siteConfig } from '@/client/config/site.config'

export default function Footer() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}`

  return (
    <footer className="w-full">

      {/* BENEFÍCIOS */}
            <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16 py-16 bg-[var(--color-bg-tertiary)] text-center px-4 border-t border-[var(--color-bg-card)]">
      
              <div>
                <h4 className="font-semibold text-lg text-[var(--color-text-primary)]">Feito à Mão</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">Cada peça com cuidado artesanal</p>
              </div>
      
              <div>
                <h4 className="font-semibold text-lg text-[var(--color-text-primary)]">Peças Exclusivas</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">Produção sob encomenda</p>
              </div>
      
              <div>
                <h4 className="font-semibold text-lg text-[var(--color-text-primary)]">Entrega no Brasil</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">Envios para todo o país</p>
              </div>
      
            </div>

      {/* FOOTER PRINCIPAL */}
      <div
        className="w-full py-16"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

          <div>
            <Image
              src={siteConfig.logoVertical}
              alt={siteConfig.logoAlt}
              width={160}
              height={80}
              className="mb-4"
            />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              {siteConfig.footerDescription}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Navegação</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {siteConfig.footerNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:opacity-80"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Contato</h4>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              WhatsApp
            </p>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition hover:opacity-80"
              style={{ color: 'var(--color-accent)' }}
            >
              {siteConfig.whatsappDisplay}
            </Link>
            <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {siteConfig.cidade}
            </p>
          </div>

        </div>
      </div>

      {/* COPYRIGHT */}
      <div
        className="flex items-center justify-center gap-2 py-6 text-xs"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-tertiary)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Link
          href="/admin/login"
          className="opacity-60 hover:opacity-100 transition"
          aria-label="Admin"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Settings className="w-3 h-3" />
        </Link>
        <span>
  © {new Date().getFullYear()} {siteConfig.nome}
  {siteConfig.copyrightTagline && (
    <> — {siteConfig.copyrightTagline}</>
  )}
</span>
      </div>

    </footer>
  )
}
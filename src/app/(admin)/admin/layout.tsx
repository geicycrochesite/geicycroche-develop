


import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import { Toaster } from 'react-hot-toast'
import AdminShell from '@/core/components/admin/AdminShell'
import { siteConfig } from '@/client/config/site.config'

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-visual',
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

function buildCssVariables(t: typeof siteConfig.theme): string {
  return `
    :root {
      --color-bg-primary:      ${t.bgPrimary};
      --color-bg-secondary:    ${t.bgSecondary};
      --color-bg-tertiary:     ${t.bgTertiary};
      --color-bg-card:         ${t.bgCard};
      --color-bg-hover:        ${t.bgHover};
      --color-overlay:         ${t.overlay};

      --color-text-primary:    ${t.textPrimary};
      --color-text-secondary:  ${t.textSecondary};
      --color-text-tertiary:   ${t.textTertiary};
      --color-text-muted:      ${t.textMuted};
      --color-text-light:      ${t.textLight};
      --color-text-hero-muted: ${t.textHeroMuted};

      --color-accent:          ${t.accent};
      --color-accent-hover:    ${t.accentHover};
      --color-accent-light:    ${t.accentLight};

      --color-error:           ${t.error};
      --color-success:         ${t.success};
      --color-info:            ${t.info};

      --color-border:          ${t.border};
      --color-border-light:    ${t.borderLight};

      --color-admin-bg:        ${t.adminBg};
      --color-admin-text:      ${t.adminText};
      --color-admin-border:    ${t.adminBorder};
    }
  `
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <head><style dangerouslySetInnerHTML={{ __html: buildCssVariables(siteConfig.theme) }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased w-full bg-[var(--color-admin-bg)] text-[var(--color-admin-text)]`}>
        <Toaster position="top-right" reverseOrder={false} />
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import Header from "@/client/components/Header";
import { CartProvider } from '@/core/context/CartContext';
import { Toaster } from "react-hot-toast";
import Footer from "@/client/components/Footer";
import { siteConfig } from "@/client/config/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),
  title: siteConfig.seo.titulo,               
  description: siteConfig.seo.descricao,       
  authors: [{ name: siteConfig.nome }],        
  keywords: siteConfig.seo.keywords,           
  openGraph: {
    title: siteConfig.seo.titulo,
    description: siteConfig.seo.descricao,
    url: siteConfig.seo.url,                   
    siteName: siteConfig.nome,
    locale: "pt_BR",
    type: "website",
    images: [{
      url: siteConfig.seo.ogImage,            
      width: 1200,
      height: 630,
      alt: siteConfig.seo.titulo,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.nome,
    description: siteConfig.seo.descricao,
    images: [siteConfig.seo.ogImage],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-br">
      <head>
        <style dangerouslySetInnerHTML={{ __html: buildCssVariables(siteConfig.theme) }} />
      </head>
      <body
        className="antialiased overflow-x-hidden"
        style={{                                    
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <Toaster position="top-right" reverseOrder={false} />
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main
              className="flex-1 w-full pt-20"
              style={{ backgroundColor: 'var(--color-bg-primary)' }}>
              {children}
            </main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
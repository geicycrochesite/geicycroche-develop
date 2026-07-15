import type {
  Metadata,
  Viewport,
} from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

import { Toaster } from "react-hot-toast";

import { CartProvider } from "@/core/context/CartContext";

import { siteConfig } from "@/client/config/site.config";

import Footer from "@/client/components/Footer";
import Header from "@/client/components/Header";
import PwaProvider from "@/core/pwa/PwaProvider";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),

  applicationName: siteConfig.nome,

  manifest: "/manifest.webmanifest",

  title: siteConfig.seo.titulo,

  description: siteConfig.seo.descricao,

  authors: [
    {
      name: siteConfig.nome,
    },
  ],

  keywords: siteConfig.seo.keywords,

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.pwa.shortName,
  },

  icons: {
    apple: siteConfig.pwa.appleTouchIcon,
  },

  formatDetection: {
    telephone: false,
  },

  openGraph: {
    title: siteConfig.seo.titulo,

    description: siteConfig.seo.descricao,

    url: siteConfig.seo.url,

    siteName: siteConfig.nome,

    locale: "pt_BR",

    type: "website",

    images: [
      {
        url: siteConfig.seo.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.seo.titulo,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: siteConfig.nome,

    description: siteConfig.seo.descricao,

    images: [
      siteConfig.seo.ogImage,
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",

  initialScale: 1,

  themeColor: siteConfig.theme.accent,
};

function buildCssVariables(
  theme: typeof siteConfig.theme,
): string {
  return `
    :root {
      --color-bg-primary: ${theme.bgPrimary};
      --color-bg-secondary: ${theme.bgSecondary};
      --color-bg-tertiary: ${theme.bgTertiary};
      --color-bg-card: ${theme.bgCard};
      --color-bg-hover: ${theme.bgHover};
      --color-overlay: ${theme.overlay};

      --color-text-primary: ${theme.textPrimary};
      --color-text-secondary: ${theme.textSecondary};
      --color-text-tertiary: ${theme.textTertiary};
      --color-text-muted: ${theme.textMuted};
      --color-text-light: ${theme.textLight};
      --color-text-hero-muted: ${theme.textHeroMuted};

      --color-accent: ${theme.accent};
      --color-accent-hover: ${theme.accentHover};
      --color-accent-light: ${theme.accentLight};

      --color-error: ${theme.error};
      --color-success: ${theme.success};
      --color-info: ${theme.info};

      --color-border: ${theme.border};
      --color-border-light: ${theme.borderLight};

      --color-admin-bg: ${theme.adminBg};
      --color-admin-text: ${theme.adminText};
      --color-admin-border: ${theme.adminBorder};
    }
  `;
}

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  const pwaEnabled =
    siteConfig.pwa.enabled &&
    process.env.NODE_ENV === "production";

  return (
    <html lang="pt-BR">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: buildCssVariables(
              siteConfig.theme,
            ),
          }}
        />
      </head>

      <body
        className="overflow-x-hidden antialiased"
        style={{
          backgroundColor:
            "var(--color-bg-primary)",

          color:
            "var(--color-text-primary)",
        }}
      >
        <PwaProvider enabled={pwaEnabled}>
          <Toaster
            position="top-right"
            reverseOrder={false}
          />

          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />

              <main
                className="w-full flex-1 pt-20"
                style={{
                  backgroundColor:
                    "var(--color-bg-primary)",
                }}
              >
                {children}
              </main>

              <Footer />
            </div>
          </CartProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";

import {
  Home,
  RefreshCw,
  WifiOff,
} from "lucide-react";

import { siteConfig } from "@/client/config/site.config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Sem conexão | ${siteConfig.nome}`,

  description:
    "Esta página não está disponível sem conexão.",

  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <section
      className="flex min-h-[70svh] items-center py-16"
      style={{
        backgroundColor:
          "var(--color-bg-primary)",
      }}
    >
      <div className="mx-auto w-full max-w-2xl px-5 text-center sm:px-8">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            backgroundColor:
              "var(--color-bg-secondary)",

            color:
              "var(--color-accent)",
          }}
        >
          <WifiOff
            aria-hidden="true"
            className="h-10 w-10"
          />
        </div>

        <h1
          className="mt-7 text-3xl font-bold sm:text-4xl"
          style={{
            color:
              "var(--color-text-primary)",
          }}
        >
          Esta página ainda não foi salva
        </h1>

        <p
          className="mx-auto mt-4 max-w-xl text-base leading-7 sm:text-lg"
          style={{
            color:
              "var(--color-text-secondary)",
          }}
        >
          Você está sem internet e esta parte do site
          ainda não foi preparada para funcionar
          offline.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold"
            style={{
              backgroundColor:
                "var(--color-accent)",

              color:
                "var(--color-text-light)",
            }}
          >
            <Home
              aria-hidden="true"
              className="h-5 w-5"
            />

            Voltar ao início
          </a>

          <button
            type="button"
            onClick={undefined}
            className="hidden"
          />

          <a
            href={siteConfig.seo.url}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-6 font-semibold"
            style={{
              borderColor:
                "var(--color-border)",

              backgroundColor:
                "var(--color-bg-card)",

              color:
                "var(--color-text-primary)",
            }}
          >
            <RefreshCw
              aria-hidden="true"
              className="h-5 w-5"
            />

            Tentar novamente
          </a>
        </div>
      </div>
    </section>
  );
}
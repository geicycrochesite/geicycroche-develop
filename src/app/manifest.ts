import type { MetadataRoute } from "next";

import { siteConfig } from "@/client/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.nome,

    short_name: siteConfig.pwa.shortName,

    description: siteConfig.seo.descricao,

    start_url: "/",

    scope: "/",

    display: "standalone",

    orientation: siteConfig.pwa.orientation,

    background_color: siteConfig.theme.bgPrimary,

    theme_color: siteConfig.theme.accent,

    lang: "pt-BR",

    icons: [
      {
        src: siteConfig.pwa.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: siteConfig.pwa.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: siteConfig.pwa.maskableIcon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
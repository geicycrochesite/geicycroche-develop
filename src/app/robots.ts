import type { MetadataRoute } from "next";

import { siteConfig } from "@/client/config/site.config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.seo.url.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/login/",
          "/cadastro/",
          "/carrinho/",
          "/checkout/",
          "/pedido/",
          "/minha-conta/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
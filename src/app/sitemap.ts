import type { MetadataRoute } from "next";

import { siteConfig } from "@/client/config/site.config";

function createUrl(pathname: string): string {
  const baseUrl = siteConfig.seo.url.replace(/\/+$/, "");

  if (pathname === "/") {
    return baseUrl;
  }

  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  return `${baseUrl}${normalizedPathname}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: createUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: createUrl("/loja"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: createUrl("/personalizado"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: createUrl("/blog"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: createUrl("/sobre"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}
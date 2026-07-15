import type { Metadata } from "next";

import { siteConfig } from "@/client/config/site.config";

interface GeneratePageMetadataParams {
  title?: string;
  description?: string;
  pathname?: string;
  image?: string;
  imageAlt?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  type?: "website" | "article";
}

function removeTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const pathnameWithSlash = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  return removeTrailingSlash(pathnameWithSlash);
}

function createAbsoluteUrl(pathname: string): string {
  const baseUrl = removeTrailingSlash(siteConfig.seo.url);
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    return baseUrl;
  }

  return `${baseUrl}${normalizedPathname}`;
}

function createImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return createAbsoluteUrl(image);
}

function createTitle(title?: string): string {
  if (!title) {
    return siteConfig.seo.titulo;
  }

  const normalizedTitle = title.trim();

  if (
    normalizedTitle
      .toLocaleLowerCase("pt-BR")
      .includes(siteConfig.nome.toLocaleLowerCase("pt-BR"))
  ) {
    return normalizedTitle;
  }

  return `${normalizedTitle} | ${siteConfig.nome}`;
}

export function generatePageMetadata({
  title,
  description = siteConfig.seo.descricao,
  pathname = "/",
  image = siteConfig.seo.ogImage,
  imageAlt,
  keywords = siteConfig.seo.keywords,
  noIndex = false,
  type = "website",
}: GeneratePageMetadataParams = {}): Metadata {
  const pageTitle = createTitle(title);
  const canonicalUrl = createAbsoluteUrl(pathname);
  const imageUrl = createImageUrl(image);

  return {
    title: pageTitle,
    description,
    keywords: [...keywords],

    alternates: {
      canonical: canonicalUrl,
    },

    authors: [
      {
        name: siteConfig.nome,
      },
    ],

    creator: siteConfig.nome,
    publisher: siteConfig.nome,

    robots: {
      index: !noIndex,
      follow: !noIndex,
      nocache: noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        noimageindex: noIndex,
        "max-image-preview": noIndex ? "none" : "large",
        "max-snippet": noIndex ? 0 : -1,
        "max-video-preview": noIndex ? 0 : -1,
      },
    },

    openGraph: {
      type,
      locale: "pt_BR",
      siteName: siteConfig.nome,
      title: pageTitle,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt ?? pageTitle,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
    },
  };
}
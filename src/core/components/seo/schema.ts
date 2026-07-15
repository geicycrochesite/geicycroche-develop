import { siteConfig } from "@/client/config/site.config";

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdObject
  | JsonLdValue[];

export interface JsonLdObject {
  [key: string]: JsonLdValue;
}

export interface BreadcrumbItem {
  name: string;
  pathname: string;
}

function removeTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function createAbsoluteUrl(pathname: string): string {
  const baseUrl = removeTrailingSlash(siteConfig.seo.url);

  if (
    pathname.startsWith("https://") ||
    pathname.startsWith("http://")
  ) {
    return pathname;
  }

  if (!pathname || pathname === "/") {
    return baseUrl;
  }

  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  return `${baseUrl}${normalizedPathname}`;
}

function createSocialLinks(): string[] {
  const links: string[] = [];

  if (siteConfig.instagram) {
    const instagramUsername = siteConfig.instagram.replace("@", "").trim();

    if (instagramUsername) {
      links.push(`https://www.instagram.com/${instagramUsername}`);
    }
  }

  if (siteConfig.facebook) {
    links.push(siteConfig.facebook);
  }

  if (siteConfig.tiktok) {
    links.push(siteConfig.tiktok);
  }

  return links;
}

export function createOrganizationSchema(): JsonLdObject {
  const socialLinks = createSocialLinks();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${createAbsoluteUrl("/")}#organization`,
    name: siteConfig.nome,
    url: createAbsoluteUrl("/"),
    logo: createAbsoluteUrl(siteConfig.logoHorizontal),
    image: createAbsoluteUrl(siteConfig.seo.ogImage),
    description: siteConfig.seo.descricao,
    ...(siteConfig.whatsapp
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: `+${siteConfig.whatsapp}`,
            contactType: "customer service",
            availableLanguage: ["Portuguese"],
            areaServed: "BR",
          },
        }
      : {}),
    ...(socialLinks.length > 0
      ? {
          sameAs: socialLinks,
        }
      : {}),
  };
}

export function createWebsiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${createAbsoluteUrl("/")}#website`,
    url: createAbsoluteUrl("/"),
    name: siteConfig.nome,
    description: siteConfig.seo.descricao,
    inLanguage: "pt-BR",
    publisher: {
      "@id": `${createAbsoluteUrl("/")}#organization`,
    },
  };
}

export function createBusinessSchema(): JsonLdObject {
  const socialLinks = createSocialLinks();

  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${createAbsoluteUrl("/")}#localbusiness`,
    name: siteConfig.nome,
    url: createAbsoluteUrl("/"),
    description: siteConfig.seo.descricao,
    image: createAbsoluteUrl(siteConfig.seo.ogImage),
    logo: createAbsoluteUrl(siteConfig.logoHorizontal),

    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.cidade,
      addressCountry: "BR",
    },

    areaServed: {
      "@type": "Country",
      name: "Brasil",
    },
  };

  if (siteConfig.whatsapp) {
    schema.telephone = `+${siteConfig.whatsapp}`;
  }

  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks;
  }

  return schema;
}

export function createBreadcrumbSchema(
  items: BreadcrumbItem[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: createAbsoluteUrl(item.pathname),
    })),
  };
}
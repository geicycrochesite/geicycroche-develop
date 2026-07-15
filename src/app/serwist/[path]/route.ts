import { createSerwistRoute } from "@serwist/turbopack";

import { siteConfig } from "@/client/config/site.config";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  `${siteConfig.nome}-${process.env.npm_package_version ?? "1.0.0"}`;

export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  swSrc: "src/app/sw.ts",

  useNativeEsbuild: true,

  additionalPrecacheEntries: [
    {
      url: "/",
      revision,
    },
    {
      url: "/offline",
      revision,
    },
  ],
});
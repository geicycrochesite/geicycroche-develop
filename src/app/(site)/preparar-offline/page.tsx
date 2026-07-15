import type { Metadata } from "next";

import { siteConfig } from "@/client/config/site.config";
import OfflinePresentationManager from "@/core/pwa/OfflinePresentationManager";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Preparar apresentação offline | ${siteConfig.nome}`,
  description:
    "Salve as páginas públicas deste site para apresentações offline.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrepareOfflinePage() {
  return (
    <OfflinePresentationManager
      appName={siteConfig.nome}
      routes={siteConfig.pwa.offlineRoutes}
    />
  );
}
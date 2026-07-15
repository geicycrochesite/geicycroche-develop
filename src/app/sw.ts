/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
} from "serwist";
import {
  NetworkOnly,
  Serwist,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST:
      | Array<PrecacheEntry | string>
      | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const privateRoutePrefixes = [
  "/admin",
  "/api",
  "/pedido",
  "/carrinho",
  "/checkout",
  "/login",
  "/cadastro",
];

function isPrivatePath(pathname: string): boolean {
  return privateRoutePrefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`),
  );
}

function requestComesFromPrivatePage(
  request: Request,
): boolean {
  if (!request.referrer) {
    return false;
  }

  try {
    const referrerUrl = new URL(request.referrer);

    return (
      referrerUrl.origin === self.location.origin &&
      isPrivatePath(referrerUrl.pathname)
    );
  } catch {
    return false;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  precacheOptions: {
    cleanupOutdatedCaches: true,
  },

  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,

  cacheId: "upnode-pwa",

  runtimeCaching: [
    {
      matcher({ request, url }) {
        if (
          url.origin === self.location.origin &&
          isPrivatePath(url.pathname)
        ) {
          return true;
        }

        return requestComesFromPrivatePage(request);
      },

      handler: new NetworkOnly(),
    },

    ...defaultCache,
  ],

  fallbacks: {
    entries: [
      {
        url: "/offline",

        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
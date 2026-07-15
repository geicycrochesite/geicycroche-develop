"use client";

import {
  CheckCircle2,
  Download,
  LoaderCircle,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

type PreparationStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "error";

interface BeforeInstallPromptEvent
  extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

interface OfflinePresentationManagerProps {
  appName: string;
  routes: string[];
}

const STORAGE_KEY =
  "upnode-offline-presentation-ready";

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function waitForServiceWorkerController() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Este navegador não oferece suporte a aplicativos offline.",
    );
  }

  await navigator.serviceWorker.ready;

  if (navigator.serviceWorker.controller) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "O aplicativo offline ainda não foi ativado. Atualize a página e tente novamente.",
        ),
      );
    }, 10000);

    function handleControllerChange() {
      window.clearTimeout(timeout);
      resolve();
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
      {
        once: true,
      },
    );
  });
}

async function warmRoute(
  route: string,
): Promise<string[]> {
  const absoluteUrl = new URL(
    route,
    window.location.origin,
  ).toString();

  return new Promise<string[]>(
    (resolve, reject) => {
      const iframe =
        document.createElement("iframe");

      iframe.setAttribute(
        "aria-hidden",
        "true",
      );

      iframe.tabIndex = -1;

      iframe.style.position = "fixed";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";

      const timeout = window.setTimeout(() => {
        iframe.remove();

        reject(
          new Error(
            `Não foi possível preparar a rota ${route}.`,
          ),
        );
      }, 30000);

      iframe.onload = async () => {
        await delay(1200);

        const resourceUrls = new Set<string>([
          absoluteUrl,
        ]);

        try {
          const resourceEntries =
            iframe.contentWindow?.performance.getEntriesByType(
              "resource",
            ) ?? [];

          resourceEntries.forEach((entry) => {
            if (
              "name" in entry &&
              typeof entry.name === "string"
            ) {
              resourceUrls.add(entry.name);
            }
          });
        } catch {
          // A navegação principal já foi carregada.
        }

        window.clearTimeout(timeout);
        iframe.remove();

        resolve(Array.from(resourceUrls));
      };

      iframe.onerror = () => {
        window.clearTimeout(timeout);
        iframe.remove();

        reject(
          new Error(
            `Erro ao carregar a rota ${route}.`,
          ),
        );
      };

      iframe.src = absoluteUrl;

      document.body.appendChild(iframe);
    },
  );
}

async function sendUrlsToServiceWorker(
  urls: string[],
) {
  const registration =
    await navigator.serviceWorker.ready;

  const worker =
    navigator.serviceWorker.controller ??
    registration.active;

  if (!worker) {
    throw new Error(
      "Service Worker não encontrado.",
    );
  }

  worker.postMessage({
    type: "CACHE_URLS",

    payload: {
      urlsToCache: Array.from(
        new Set(urls),
      ),
    },
  });
}

export default function OfflinePresentationManager({
  appName,
  routes,
}: OfflinePresentationManagerProps) {
  const [
    status,
    setStatus,
  ] = useState<PreparationStatus>("idle");

  const [
    currentRoute,
    setCurrentRoute,
  ] = useState("");

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    savedAt,
    setSavedAt,
  ] = useState("");

  const [
    isOnline,
    setIsOnline,
  ] = useState(true);

  const [
    installPrompt,
    setInstallPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    );

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const savedValue =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (savedValue) {
      setSavedAt(savedValue);
      setStatus("ready");
    }

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    function handleBeforeInstallPrompt(
      event: Event,
    ) {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent,
      );
    }

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function prepareOfflinePresentation() {
    if (!navigator.onLine) {
      setStatus("error");

      setErrorMessage(
        "Conecte o tablet à internet antes de preparar a apresentação.",
      );

      return;
    }

    setStatus("preparing");
    setErrorMessage("");
    setProgress(0);

    try {
      await waitForServiceWorkerController();

      if (
        "storage" in navigator &&
        "persist" in navigator.storage
      ) {
        await navigator.storage.persist();
      }

      const allResources =
        new Set<string>();

      for (
        let index = 0;
        index < routes.length;
        index += 1
      ) {
        const route = routes[index];

        setCurrentRoute(route);

        const resources =
          await warmRoute(route);

        resources.forEach((resource) => {
          allResources.add(resource);
        });

        await sendUrlsToServiceWorker(
          resources,
        );

        setProgress(index + 1);

        await delay(500);
      }

      const currentPageResources =
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name);

      currentPageResources.forEach(
        (resource) => {
          allResources.add(resource);
        },
      );

      await sendUrlsToServiceWorker(
        Array.from(allResources),
      );

      await delay(1500);

      const savedDate =
        new Date().toLocaleString("pt-BR");

      window.localStorage.setItem(
        STORAGE_KEY,
        savedDate,
      );

      setSavedAt(savedDate);
      setCurrentRoute("");
      setStatus("ready");
    } catch (error) {
      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível preparar a apresentação offline.",
      );
    }
  }

  async function installApplication() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();

    const choice =
      await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  const progressPercentage =
    routes.length > 0
      ? Math.round(
          (progress / routes.length) * 100,
        )
      : 0;

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        backgroundColor:
          "var(--color-bg-primary)",
      }}
    >
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center">
          <span
            className="text-sm font-bold tracking-[0.16em] uppercase"
            style={{
              color:
                "var(--color-accent)",
            }}
          >
            Modo apresentação
          </span>

          <h1
            className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl"
            style={{
              color:
                "var(--color-text-primary)",
            }}
          >
            Salvar {appName} para usar offline
          </h1>

          <p
            className="mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg"
            style={{
              color:
                "var(--color-text-secondary)",
            }}
          >
            Prepare as páginas e imagens deste site
            para apresentar no tablet mesmo sem
            conexão com a internet.
          </p>
        </div>

        <div
          className="mt-10 rounded-[2rem] border p-6 shadow-xl sm:p-8"
          style={{
            borderColor:
              "var(--color-border-light)",

            backgroundColor:
              "var(--color-bg-card)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: isOnline
                  ? "color-mix(in srgb, var(--color-success) 14%, var(--color-bg-card))"
                  : "color-mix(in srgb, var(--color-error) 14%, var(--color-bg-card))",

                color: isOnline
                  ? "var(--color-success)"
                  : "var(--color-error)",
              }}
            >
              {isOnline ? (
                <Wifi
                  aria-hidden="true"
                  className="h-7 w-7"
                />
              ) : (
                <WifiOff
                  aria-hidden="true"
                  className="h-7 w-7"
                />
              )}
            </div>

            <div>
              <h2
                className="text-lg font-bold"
                style={{
                  color:
                    "var(--color-text-primary)",
                }}
              >
                {isOnline
                  ? "Tablet conectado"
                  : "Tablet sem internet"}
              </h2>

              <p
                className="mt-1 text-sm"
                style={{
                  color:
                    "var(--color-text-secondary)",
                }}
              >
                {isOnline
                  ? "Você pode preparar ou atualizar a versão offline."
                  : "A preparação exige conexão com a internet."}
              </p>
            </div>
          </div>

          <div
            className="mt-7 rounded-3xl p-5"
            style={{
              backgroundColor:
                "var(--color-bg-secondary)",
            }}
          >
            <p
              className="font-bold"
              style={{
                color:
                  "var(--color-text-primary)",
              }}
            >
              Páginas que serão salvas
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {routes.map((route) => (
                <li
                  key={route}
                  className="flex items-center gap-2 text-sm"
                  style={{
                    color:
                      "var(--color-text-secondary)",
                  }}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        "var(--color-success)",
                    }}
                  />

                  {route}
                </li>
              ))}
            </ul>
          </div>

          {status === "preparing" && (
            <div
              className="mt-6"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      "var(--color-text-primary)",
                  }}
                >
                  Preparando {currentRoute}
                </p>

                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      "var(--color-accent)",
                  }}
                >
                  {progressPercentage}%
                </span>
              </div>

              <div
                className="mt-3 h-3 overflow-hidden rounded-full"
                style={{
                  backgroundColor:
                    "var(--color-bg-tertiary)",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercentage}%`,

                    backgroundColor:
                      "var(--color-accent)",
                  }}
                />
              </div>
            </div>
          )}

          {status === "ready" && (
            <div
              className="mt-6 rounded-3xl border p-5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-success) 35%, transparent)",

                backgroundColor:
                  "color-mix(in srgb, var(--color-success) 9%, var(--color-bg-card))",
              }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-6 w-6 shrink-0"
                  style={{
                    color:
                      "var(--color-success)",
                  }}
                />

                <div>
                  <p
                    className="font-bold"
                    style={{
                      color:
                        "var(--color-text-primary)",
                    }}
                  >
                    Apresentação offline preparada
                  </p>

                  {savedAt && (
                    <p
                      className="mt-1 text-sm"
                      style={{
                        color:
                          "var(--color-text-secondary)",
                      }}
                    >
                      Última atualização: {savedAt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div
              className="mt-6 rounded-3xl border p-5"
              role="alert"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-error) 35%, transparent)",

                backgroundColor:
                  "color-mix(in srgb, var(--color-error) 9%, var(--color-bg-card))",
              }}
            >
              <p
                className="font-semibold"
                style={{
                  color:
                    "var(--color-error)",
                }}
              >
                {errorMessage}
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                prepareOfflinePresentation
              }
              disabled={
                !isOnline ||
                status === "preparing"
              }
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-6 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor:
                  "var(--color-accent)",

                color:
                  "var(--color-text-light)",
              }}
            >
              {status === "preparing" ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin"
                  />

                  Preparando páginas
                </>
              ) : status === "ready" ? (
                <>
                  <RefreshCw
                    aria-hidden="true"
                    className="h-5 w-5"
                  />

                  Atualizar versão offline
                </>
              ) : (
                <>
                  <Download
                    aria-hidden="true"
                    className="h-5 w-5"
                  />

                  Preparar apresentação offline
                </>
              )}
            </button>

            {installPrompt && (
              <button
                type="button"
                onClick={installApplication}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-6 font-semibold"
                style={{
                  borderColor:
                    "var(--color-border)",

                  backgroundColor:
                    "var(--color-bg-primary)",

                  color:
                    "var(--color-text-primary)",
                }}
              >
                <Smartphone
                  aria-hidden="true"
                  className="h-5 w-5"
                />

                Instalar no tablet
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-6 rounded-3xl border p-6"
          style={{
            borderColor:
              "var(--color-border-light)",

            backgroundColor:
              "var(--color-bg-secondary)",
          }}
        >
          <h2
            className="text-lg font-bold"
            style={{
              color:
                "var(--color-text-primary)",
            }}
          >
            Depois de preparar
          </h2>

          <p
            className="mt-3 text-sm leading-6 sm:text-base"
            style={{
              color:
                "var(--color-text-secondary)",
            }}
          >
            No navegador do tablet, abra o menu e
            escolha “Adicionar à tela inicial” ou
            “Instalar aplicativo”. Depois ative o modo
            avião e abra o site pelo ícone criado.
          </p>

          <a
            href="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 font-semibold"
            style={{
              backgroundColor:
                "var(--color-success)",

              color:
                "var(--color-text-light)",
            }}
          >
            Abrir página inicial
          </a>
        </div>
      </div>
    </section>
  );
}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { setupServiceWorker } from "../lib/pwa";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="max-w-sm text-center">
        <p className="font-display text-7xl font-bold text-forest">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-forest">Página não encontrada</h1>
        <p className="mt-2 text-base text-muted-text">Esse endereço não existe ou mudou de lugar.</p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-leaf-dark px-6 text-base font-semibold text-cream"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-bold text-forest">Algo não carregou</h1>
        <p className="mt-2 text-base text-muted-text">Foi um problema do nosso lado. Tente de novo em instantes.</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-13 cursor-pointer items-center justify-center rounded-full bg-leaf-dark px-6 text-base font-semibold text-cream"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex min-h-13 items-center justify-center rounded-full border-2 border-forest px-6 text-base font-semibold text-forest"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Colheita Certa" },
      {
        name: "description",
        content:
          "Pedidos por toque para horticultores do Alto Tietê e seus compradores: vitrine, voz, colheita, rota e ganhos.",
      },
      { name: "author", content: "Colheita Certa" },
      { property: "og:title", content: "Colheita Certa" },
      {
        property: "og:description",
        content: "Peça por toque ou por voz. Colha com a lista pronta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#14301F" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Colheita Certa" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Domine:wght@400..700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    void setupServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}

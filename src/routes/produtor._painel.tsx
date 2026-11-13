import { createFileRoute, Link, Navigate, Outlet } from "@tanstack/react-router";
import { PanelPending } from "@/components/list-states";
import { useEffect } from "react";
import { ClipboardList, Sprout, Route as RouteIcon, TrendingUp, Menu, Link2, Package } from "lucide-react";

import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InstallBanner } from "@/components/pwa/install-banner";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { Splash } from "@/components/pwa/splash";
import { usePanel } from "@/lib/panel-context";
import { DEMO_PROFILE } from "@/lib/producer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/_painel")({
  component: PanelShell,
});

const TABS = [
  { to: "/produtor/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/produtor/colheita", label: "Colheita", icon: Sprout },
  { to: "/produtor/rota", label: "Rota", icon: RouteIcon },
  { to: "/produtor/ganhos", label: "Ganhos", icon: TrendingUp },
] as const;

const EXTRA = [
  { to: "/produtor/link", label: "Meu link", icon: Link2 },
  { to: "/produtor/produtos", label: "Produtos", icon: Package },
] as const;

function PanelShell() {
  const { state, update, live, phase } = usePanel();
  const newCount = state.orders.filter((o) => o.status === "pendente").length;

  // Opening the panel directly (demo) without signup: fill in Marcos.
  useEffect(() => {
    if (!live && !state.profile) update((s) => ({ ...s, profile: DEMO_PROFILE }));
  }, [live, state.profile, update]);

  const badge = newCount > 0 ? (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber px-1.5 text-[14px] font-bold leading-6 text-forest">
      {newCount}
    </span>
  ) : null;

  if (live && phase === "signed-out") return <Navigate to="/produtor/entrar" replace />;
  if (live && phase === "no-profile") return <Navigate to="/produtor/cadastro" replace />;
  if (live && phase === "loading" && !state.profile) return <PanelPending />;

  return (
    <div className="min-h-screen bg-cream md:flex">
      <Splash />
      {/* Desktop side menu */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 bg-forest px-4 py-6 md:flex">
        <Logo variant="light" size={36} className="px-2" />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Painel">
          {[...TABS, ...EXTRA].map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex min-h-12 items-center gap-3 rounded-full px-4 text-lg font-semibold text-cream hover:bg-forest-2"
              activeProps={{ className: "bg-forest-2 text-cream" }}
            >
              <t.icon className="size-5" />
              <span className="flex-1">{t.label}</span>
              {t.to === "/produtor/pedidos" ? badge : null}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-forest px-4 py-3 md:hidden">
          <Logo variant="light" size={32} />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Menu"
              className="inline-flex size-12 items-center justify-center rounded-full text-cream hover:bg-forest-2"
            >
              <Menu className="size-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52 rounded-2xl border-2 border-line bg-paper p-2">
              {EXTRA.map((t) => (
                <DropdownMenuItem key={t.to} asChild className="min-h-12 rounded-xl text-lg text-ink">
                  <Link to={t.to}>
                    <t.icon className="size-5" /> {t.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 md:pb-12 md:pt-10">
          <div className="mb-6 flex flex-col gap-4 empty:hidden">
            <OfflineBanner />
            <InstallBanner />
          </div>
          <Outlet />
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Painel"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-2 border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group relative flex min-h-16 flex-col items-center justify-center gap-1 text-[14px] font-semibold text-muted-text"
              activeProps={{ className: "text-forest" }}
            >
              {({ isActive }) => (
                <>
                  <span className={cn("relative inline-flex h-8 w-14 items-center justify-center rounded-full", isActive && "bg-sand")}>
                    <t.icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                    {t.to === "/produtor/pedidos" && newCount > 0 ? (
                      <span className="absolute -right-1 -top-1">{badge}</span>
                    ) : null}
                  </span>
                  {t.label}
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

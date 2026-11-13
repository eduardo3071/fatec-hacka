import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { usePanel } from "@/lib/panel-context";

export const Route = createFileRoute("/produtor/")({
  head: () => ({
    meta: [
      { title: "Entrar · Colheita Certa para produtores" },
      { name: "description", content: "Receba pedidos por toque e voz e colha com a lista pronta." },
      { property: "og:title", content: "Colheita Certa para produtores" },
      { property: "og:description", content: "Venda direto, colha com a lista pronta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});

function Entry() {
  const { state } = usePanel();
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-forest px-6 pb-10 pt-12 text-cream">
      <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -bottom-24 -right-20 size-[22rem]">
        <circle cx="80" cy="85" r="64" fill="var(--color-amber)" fillOpacity="0.9" />
        <circle cx="130" cy="128" r="64" fill="var(--color-leaf)" fillOpacity="0.75" />
      </svg>
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <Logo variant="light" size={48} />
        <h1 className="mt-auto animate-fade-up font-display text-5xl font-bold leading-tight text-cream">
          Venda direto, colha com a lista pronta.
        </h1>
        <p className="mt-4 animate-fade-up text-lg text-cream/85 [animation-delay:80ms]">
          Os pedidos chegam no celular. A colheita e a rota já vêm somadas.
        </p>
        <Button
          variant="amber"
          size="lg"
          className="mt-10 h-16 w-full animate-fade-up text-xl [animation-delay:160ms]"
          onClick={() => navigate({ to: state.profile ? "/produtor/pedidos" : "/produtor/cadastro" })}
        >
          Entrar <ArrowRight />
        </Button>
        <p className="mt-3 text-center text-[15px] text-cream/80">Exemplo: sem senha por enquanto.</p>
      </div>
    </div>
  );
}

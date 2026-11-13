import { ListSkeleton, RouteListError } from "@/components/list-states";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { PageTitle } from "@/components/producer/day-picker";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { usePanel } from "@/lib/panel-context";

export const Route = createFileRoute("/produtor/_painel/link")({
  head: () => ({
    meta: [
      { title: "Meu link · Painel do produtor" },
      { name: "description", content: "Compartilhe seu link de pedidos com os compradores." },
      { property: "og:title", content: "Meu link · Colheita Certa" },
      { property: "og:description", content: "Seu link de pedidos, com QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyLink,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

function MyLink() {
  const { state } = usePanel();
  const p = state.profile;
  if (!p) return null;
  const url = `${window.location.origin}/p/${p.slug}`;
  const pretty = url.replace(/^https?:\/\//, "");
  const message = `Bom dia! Agora você pode fazer seu pedido de verduras comigo pelo celular, em poucos toques: ${url}\nEntrego no dia e horário que você escolher. ${p.name}`;

  return (
    <div>
      <PageTitle sub="Mande para seus compradores. Eles pedem por aqui, sem baixar nada.">Meu link</PageTitle>
      <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-cream shadow-lift">
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -top-16 size-52">
          <circle cx="80" cy="85" r="58" fill="var(--color-amber)" fillOpacity="0.9" />
          <circle cx="128" cy="125" r="58" fill="var(--color-leaf)" fillOpacity="0.75" />
        </svg>
        <div className="relative">
          <Logo variant="light" size={30} />
          <p className="mt-6 text-base text-cream/85">Peça direto da horta do</p>
          <p className="font-display text-4xl font-bold text-cream">{p.name}</p>
          <p className="text-base text-cream/85">{p.city}</p>
          <div className="mt-6 flex justify-center rounded-3xl bg-paper p-5">
            <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="var(--color-forest)" title="QR code do seu link" />
          </div>
          <p className="mt-4 break-all text-center font-display text-lg font-bold text-cream">{pretty}</p>
        </div>
      </section>
      <div className="mt-5 flex flex-col gap-3">
        <Button
          size="lg"
          className="h-16 text-lg"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              /* ignore */
            }
            toast.success("Link copiado.");
          }}
        >
          <Copy /> Copiar link
        </Button>
        <Button asChild variant="amber" size="lg" className="h-16 text-lg">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> Compartilhar no WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

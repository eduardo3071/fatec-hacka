import { createFileRoute, notFound, Outlet, Link } from "@tanstack/react-router";

import { CartProvider } from "@/lib/cart-context";
import { loadCatalog } from "@/lib/buyer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const catalog = await loadCatalog(params.slug);
    if (!catalog) throw notFound();
    return catalog;
  },
  errorComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-forest">Não deu para abrir a vitrine</h1>
      <p className="max-w-xs text-base text-muted-text">Foi um problema do nosso lado ou da conexão. Tente de novo em instantes.</p>
      <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
    </div>
  ),
  head: ({ loaderData }) => {
    const name = loaderData?.producer.name ?? "Produtor";
    const title = `Horta do ${name} · Colheita Certa`;
    const description = loaderData
      ? `Peça verduras direto do ${name}, de ${loaderData.producer.city}. Entrega amanhã.`
      : "Peça verduras direto do produtor.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [
          { property: "og:image", content: `https://fatec-hacka.lovable.app/og-${loaderData.producer.slug}.png` },
          { name: "twitter:image", content: `https://fatec-hacka.lovable.app/og-${loaderData.producer.slug}.png` },
        ] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-forest">Produtor não encontrado</h1>
      <p className="max-w-xs text-base text-muted-text">Confira o link que o produtor te mandou.</p>
      <Button asChild variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  ),
  component: BuyerLayout,
});

function BuyerLayout() {
  const { slug } = Route.useParams();
  const catalog = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto min-h-screen max-w-[480px] bg-cream shadow-card">
        <CartProvider slug={slug} catalog={catalog}>
          <Outlet />
        </CartProvider>
      </div>
    </div>
  );
}

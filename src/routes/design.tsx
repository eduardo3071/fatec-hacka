import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Copy,
  Leaf,
  Mic,
  Package,
  QrCode,
  ShoppingCart,
  Sun,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip } from "@/components/chip";
import { Stepper } from "@/components/stepper";
import { BottomSheet } from "@/components/bottom-sheet";
import { EmptyState } from "@/components/empty-state";
import { TimelineStatus, type TimelineStep } from "@/components/timeline-status";
import { BigNumber } from "@/components/big-number";
import { Logo } from "@/components/logo";
import { formatMoney, formatQty } from "@/lib/format";
import { PRODUCTS, SAMPLE_ORDER, orderTotal, type Product } from "@/lib/mock";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Base visual — Colheita Certa" },
      {
        name: "description",
        content:
          "Cores, fontes e componentes do Colheita Certa: verde-floresta, creme, âmbar e ferrugem.",
      },
      { property: "og:title", content: "Base visual — Colheita Certa" },
      {
        property: "og:description",
        content: "A paleta, a tipografia e os componentes do app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignPage,
});

const PALETTE: { name: string; hex: string; use: string; token: string }[] = [
  { name: "Verde-floresta", hex: "#14301F", use: "Fundos escuros, títulos", token: "forest" },
  { name: "Floresta 2", hex: "#1D4029", use: "Cartões no escuro", token: "forest-2" },
  { name: "Verde-folha escuro", hex: "#2F6B2A", use: "Botão principal", token: "leaf-dark" },
  { name: "Verde-folha", hex: "#5E9B3C", use: "Detalhes, ícones", token: "leaf" },
  { name: "Creme", hex: "#F6F1E4", use: "Fundo da página", token: "cream" },
  { name: "Areia", hex: "#EADFC6", use: "Fundo secundário", token: "sand" },
  { name: "Papel", hex: "#FFFBF0", use: "Cartões", token: "paper" },
  { name: "Âmbar", hex: "#EE9A3A", use: "Destaque (texto forest)", token: "amber" },
  { name: "Ferrugem", hex: "#A8480B", use: "Números sobre claro", token: "rust" },
  { name: "Tinta", hex: "#1D2B22", use: "Texto principal", token: "ink" },
  { name: "Cinza-verde", hex: "#4A5A4F", use: "Texto secundário", token: "muted-text" },
  { name: "Linha", hex: "#D9CDAE", use: "Bordas de 2px", token: "line" },
];

const STEPS: TimelineStep[] = [
  { label: "Pedido enviado", description: "Ontem, 19:42", state: "done" },
  { label: "Marcos aceitou", description: "Hoje, 06:10", state: "done" },
  { label: "Entregue", description: "Amanhã, 07:00", state: "current" },
  { label: "Pago", state: "todo" },
];

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up border-t-2 border-line pt-10">
      <h2 className="font-display text-3xl font-bold text-forest">{title}</h2>
      {hint ? <p className="mt-1 max-w-lg text-base text-muted-text">{hint}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(0);
  return (
    <Card
      className={qty > 0 ? "border-leaf-dark bg-paper" : undefined}
      aria-label={`${product.name}, ${formatMoney(product.price)} por ${product.unit}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className="inline-flex size-16 items-center justify-center rounded-2xl bg-sand text-3xl"
        >
          {product.glyph}
        </span>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-ink">{formatMoney(product.price)}</p>
          <p className="text-sm text-muted-text">por {product.unit}</p>
        </div>
      </div>
      <p className="mt-4 font-display text-xl font-bold text-ink">{product.name}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-text">{formatQty(qty, product.unit)}</span>
        <Stepper value={qty} onChange={setQty} label={product.name} />
      </div>
    </Card>
  );
}

function DesignPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chips, setChips] = useState<string[]>(["Amanhã"]);
  const [qty, setQty] = useState(3);
  const order = SAMPLE_ORDER;

  const toggleChip = (label: string) =>
    setChips((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]));

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-line bg-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <Logo variant="dark" size={44} />
          <Badge variant="secondary">base visual · dados de exemplo</Badge>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-12">
        <section className="animate-fade-up">
          <h1 className="font-display text-4xl font-bold text-forest">
            Base visual do Colheita Certa
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-text">
            Campo, manhã cedo, colheita. Tudo legível sob sol forte no celular.
          </p>
        </section>

        <Section title="Marca" hint="Dois círculos sobrepostos: sol âmbar e folha verde.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center justify-center border-forest bg-forest py-12">
              <Logo variant="light" size={48} />
            </Card>
            <Card className="flex items-center justify-center py-12">
              <Logo variant="dark" size={48} />
            </Card>
          </div>
        </Section>

        <Section title="Paleta" hint="Nada fora destas cores.">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {PALETTE.map((c) => (
              <li
                key={c.token}
                className="rounded-2xl border-2 border-line bg-paper p-3 shadow-card"
              >
                <span
                  className="block h-16 rounded-xl border-2 border-line"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="mt-3 font-display text-base font-bold text-ink">{c.name}</p>
                <p className="text-sm text-muted-text">{c.hex}</p>
                <p className="mt-1 text-sm text-muted-text">{c.use}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tipografia" hint="Domine para títulos e números; DM Sans para o resto.">
          <Card>
            <div className="flex flex-wrap items-end gap-8">
              <BigNumber value="R$ 340" label="a mais que com o intermediário" />
              <div>
                <p className="font-display text-3xl font-bold text-forest">Título 28–36px</p>
                <p className="mt-2 max-w-sm text-lg text-ink">
                  Corpo 17–18px: o pedido chega no celular do Marcos com o nome do comprador, os
                  itens e a hora da entrega.
                </p>
                <p className="mt-2 text-sm text-muted-text">Rótulo 14–15px · nada abaixo de 14px</p>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Botões" hint="Pílula, 52px de altura, alvo de toque de 48px ou mais.">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Primary</Button>
            <Button variant="amber">
              <Mic />
              Pedir falando
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Recusar</Button>
            <Button isLoading>Enviando</Button>
            <Button variant="amber" size="icon" aria-label="Gravar pedido">
              <Mic />
            </Button>
          </div>
        </Section>

        <Section title="Chips e badges" hint="Chips selecionáveis para dia e horário.">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-3">
              {["Hoje", "Amanhã", "Escolher data"].map((label) => (
                <Chip
                  key={label}
                  selected={chips.includes(label)}
                  onClick={() => toggleChip(label)}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="pending">Novo pedido</Badge>
              <Badge variant="accepted">Aceito</Badge>
              <Badge variant="delivered">Entregue</Badge>
              <Badge variant="paid">Pago</Badge>
              <Badge variant="rejected">Recusado</Badge>
              <Badge variant="outline">Sem status</Badge>
            </div>
          </div>
        </Section>

        <Section title="Stepper de quantidade" hint="Botões grandes e um pulo curto ao mudar.">
          <div className="flex flex-wrap items-center gap-6">
            <Stepper value={qty} onChange={setQty} label="maços de alface" />
            <p className="text-lg text-ink">{formatQty(qty, "maço")}</p>
          </div>
        </Section>

        <Section title="Catálogo" hint="Cartões de produto com destaque quando há quantidade.">
          <div className="grid gap-4 sm:grid-cols-2">
            {PRODUCTS.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>

        <Section title="Acompanhamento" hint="Linha do tempo com o passo atual em âmbar.">
          <Card>
            <TimelineStatus steps={STEPS} />
          </Card>
        </Section>

        <Section title="Vazio, carregando e aviso" hint="Frases curtas, no tom de quem fala com o freguês.">
          <div className="grid gap-4">
            <EmptyState
              icon={ShoppingCart}
              title="Nada no carrinho ainda."
              description="Que tal começar pela alface?"
              action={<Button variant="amber">Ver catálogo</Button>}
            />
            <Card>
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </Card>
            <Card className="border-amber bg-amber">
              <div className="flex items-center gap-3">
                <Bell className="size-6 text-forest" />
                <p className="font-semibold text-forest">2 pedidos esperando sua resposta</p>
              </div>
            </Card>
          </div>
        </Section>

        <Section title="Gaveta e aviso" hint="A gaveta sobe de baixo; o aviso aparece embaixo.">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              Abrir gaveta
            </Button>
            <Button
              variant="amber"
              onClick={() =>
                toast.success("Chave Pix copiada", {
                  description: "O pagamento vai direto para o Marcos.",
                })
              }
            >
              <Copy />
              Copiar chave Pix
            </Button>
          </div>
        </Section>

        <Section title="Pedido de exemplo" hint="Resumo com total em número grande.">
          <Card>
            <CardHeader>
              <CardTitle>{order.buyer.name}</CardTitle>
              <CardDescription>
                {order.items.map((i) => formatQty(i.quantity, i.product.unit)).join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end justify-between gap-6">
              <BigNumber value={formatMoney(orderTotal(order))} label="total do pedido" />
              <div className="flex flex-wrap gap-2">
                <Badge variant="pending">
                  <Sun className="size-4" />
                  Entrega amanhã
                </Badge>
                <Badge variant="outline">
                  <Truck className="size-4" />
                  07:00
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="flex-1">
                <Check />
                Aceitar pedido
              </Button>
              <Button variant="outline">Recusar</Button>
            </CardFooter>
          </Card>
        </Section>

        <div className="dark animate-fade-up rounded-3xl bg-forest p-6 sm:p-10">
          <h2 className="font-display text-3xl font-bold text-cream">Versão escura</h2>
          <p className="mt-1 max-w-lg text-base text-cream/75">
            Fundo verde-floresta com cartões floresta 2.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border-2 border-line/25 bg-card p-6">
              <Logo variant="light" size={40} />
              <p className="mt-4 text-base text-cream/80">
                Venda direto, colha com a lista pronta.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button>Entrar</Button>
                <Button variant="amber">Ver vitrine</Button>
              </div>
            </div>
            <div className="rounded-3xl border-2 border-line/25 bg-card p-6">
              <BigNumber value="R$ 340" tone="cream" label="a mais este mês" />
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="paid">
                  <QrCode className="size-4" />
                  Pix
                </Badge>
                <Badge variant="accepted">
                  <Leaf className="size-4" />
                  Colhido
                </Badge>
                <Badge variant="delivered">
                  <Package className="size-4" />
                  Entregue
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-line pt-8">
          <Link to="/" className="text-base font-semibold text-leaf-dark underline">
            Voltar para a abertura
          </Link>
        </div>
      </main>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Pedir falando"
        description="Fale o pedido: “vinte maços de alface e dez de couve, amanhã às sete”."
        footer={
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Está certo, ir para o pedido
            </Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Gravar de novo
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-6 py-6">
          <Button variant="amber" size="icon" className="size-24" aria-label="Gravar pedido">
            <Mic />
          </Button>
          <p className="text-center text-base text-muted-text">Toque para gravar. 00:00</p>
          <div className="w-full space-y-3">
            {PRODUCTS.slice(0, 2).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-line bg-cream p-4"
              >
                <div>
                  <p className="font-display text-lg font-bold text-ink">{p.name}</p>
                  <p className="text-sm text-muted-text">{formatMoney(p.price)} / {p.unit}</p>
                </div>
                <Stepper value={1} onChange={() => {}} label={p.name} />
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

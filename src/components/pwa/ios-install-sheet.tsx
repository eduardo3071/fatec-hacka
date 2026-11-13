import { Share, SquarePlus, Check } from "lucide-react";

import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber font-display text-lg font-bold text-forest">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-ink">{title}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

export default function IosInstallSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Instalar no iPhone"
      description="O aviso de pedido novo só funciona com o app instalado."
      footer={<Button className="w-full" onClick={() => onOpenChange(false)}>Entendi</Button>}
    >
      <ol className="flex flex-col gap-6">
        <Step n={1} title="Toque em Compartilhar">
          <div aria-hidden className="flex items-center justify-around rounded-2xl border-2 border-line bg-cream px-4 py-3 text-muted-text">
            <span className="text-base">‹</span>
            <span className="text-base">›</span>
            <span className="flex size-12 items-center justify-center rounded-full bg-amber text-forest ring-4 ring-amber/30">
              <Share className="size-6" />
            </span>
            <span className="text-base">▢</span>
          </div>
          <p className="mt-2 text-base text-muted-text">Fica na barra de baixo do Safari.</p>
        </Step>
        <Step n={2} title="Depois em Adicionar à Tela de Início">
          <div aria-hidden className="rounded-2xl border-2 border-line bg-cream p-2">
            <div className="flex min-h-12 items-center justify-between rounded-xl px-3 text-base text-muted-text">Copiar</div>
            <div className="flex min-h-12 items-center justify-between rounded-xl bg-amber px-3 text-base font-semibold text-forest">
              Adicionar à Tela de Início <SquarePlus className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-base text-muted-text">Role a lista para baixo se não aparecer.</p>
        </Step>
        <Step n={3} title="Toque em Adicionar">
          <p className="flex items-center gap-2 text-base text-muted-text">
            <Check className="size-5 text-leaf-dark" aria-hidden /> O ícone da Colheita Certa aparece na sua tela.
          </p>
        </Step>
      </ol>
    </BottomSheet>
  );
}

import { lazy, Suspense, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isIos, isStandalone } from "@/lib/pwa";

const IosInstallSheet = lazy(() => import("./ios-install-sheet"));

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "cc:install-dismissed";

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(KEY)) return;
    if (isIos()) {
      setIos(true);
      setVisible(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    if (ios) return setSheet(true);
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  return (
    <aside aria-label="Instalar o app" className="relative overflow-hidden rounded-3xl bg-forest p-5 text-cream">
      <span aria-hidden className="absolute -right-8 -top-10 size-32 rounded-full bg-amber/25" />
      <span aria-hidden className="absolute -bottom-12 right-10 size-28 rounded-full bg-leaf/30" />
      <div className="relative flex items-start gap-4">
        <img src="/icons/icon-192.png" alt="" width={56} height={56} className="size-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold">Instale o Colheita Certa</p>
          <p className="mt-1 text-base text-cream/90">Abre com um toque e avisa quando chegar pedido novo.</p>
          <Button variant="amber" className="mt-4" onClick={install}>
            <Download /> {ios ? "Ver como instalar" : "Instalar app"}
          </Button>
        </div>
        <button
          type="button"
          aria-label="Agora não"
          onClick={dismiss}
          className="-mr-2 -mt-2 inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-cream hover:bg-forest-2"
        >
          <X className="size-5" />
        </button>
      </div>
      {sheet ? (
        <Suspense fallback={null}>
          <IosInstallSheet open={sheet} onOpenChange={setSheet} />
        </Suspense>
      ) : null}
    </aside>
  );
}

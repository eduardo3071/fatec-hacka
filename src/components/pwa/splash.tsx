import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { isStandalone } from "@/lib/pwa";

/** Brand screen shown briefly when the installed app opens. */
export function Splash() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isStandalone() || sessionStorage.getItem("cc:splash")) return;
    sessionStorage.setItem("cc:splash", "1");
    setShow(true);
    const id = window.setTimeout(() => setShow(false), 900);
    return () => window.clearTimeout(id);
  }, []);
  if (!show) return null;
  return (
    <div aria-hidden className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-forest motion-safe:animate-in motion-safe:fade-in">
      <Logo variant="light" size={64} />
      <p className="text-base text-cream/90">Venda direto, colha com a lista pronta</p>
    </div>
  );
}

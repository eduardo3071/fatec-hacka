import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Shows a calm strip while the phone has no internet. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="flex items-center gap-3 rounded-3xl bg-sand px-4 py-3 text-base text-ink">
      <WifiOff className="size-6 shrink-0 text-rust" aria-hidden />
      <p>
        <strong className="font-semibold">Sem internet agora.</strong> Mostrando o que estava salvo. Atualiza sozinho quando voltar.
      </p>
    </div>
  );
}

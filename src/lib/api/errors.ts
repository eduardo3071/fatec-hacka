import { toast } from "sonner";

import { ApiError } from "./client";

export const AI_DOWN = "A IA está indisponível agora. Monte o pedido pelo catálogo.";
export const TOO_MANY = "Muitos pedidos em pouco tempo. Respire e tente daqui a pouco — o catálogo continua aqui.";

/** Short, blame-free Portuguese message for any failure. */
export function apiMessage(err: unknown, opts: { ai?: boolean } = {}): string {
  if (err instanceof ApiError) {
    if (err.kind === "network") return "Sem conexão agora. Tente de novo quando a internet voltar.";
    if (err.status === 429) return TOO_MANY;
    if (opts.ai && (err.status === 502 || err.status === 503)) return AI_DOWN;
    return err.detail;
  }
  return "Algo não saiu como esperado. Tente de novo.";
}

/** Toast the error; 401 sends the producer back to sign-in. */
export function showApiError(err: unknown, opts: { ai?: boolean } = {}) {
  if (err instanceof ApiError && err.status === 401 && typeof window !== "undefined") {
    toast("Sua sessão terminou. Entre de novo.");
    window.location.assign("/produtor/entrar");
    return;
  }
  toast.error(apiMessage(err, opts));
}

export function isNoProfile(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

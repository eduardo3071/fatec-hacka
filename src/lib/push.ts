import { producerApi } from "@/lib/api";

function b64ToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Registers this browser for Web Push with the API. Needs the installed app's service worker. */
export async function subscribePush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const res = await producerApi.pushPublicKey();
    const key = typeof res === "string" ? res : (res.public_key ?? res.key ?? "");
    if (!key) return false;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) as BufferSource });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.["p256dh"] || !json.keys["auth"]) return false;
    await producerApi.pushSubscribe({ endpoint: json.endpoint, keys: { p256dh: json.keys["p256dh"], auth: json.keys["auth"] } });
    return true;
  } catch {
    return false;
  }
}

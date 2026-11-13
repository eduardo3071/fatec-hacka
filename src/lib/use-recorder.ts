import { useRef } from "react";

/** Records microphone audio with MediaRecorder (webm when supported). */
export function useRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);

  async function start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported?.(m));
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.start();
    rec.current = r;
    started.current = Date.now();
  }

  function stop(): Promise<{ blob: Blob; seconds: number } | null> {
    const r = rec.current;
    if (!r) return Promise.resolve(null);
    return new Promise((resolve) => {
      r.onstop = () => {
        r.stream.getTracks().forEach((t) => t.stop());
        rec.current = null;
        resolve({ blob: new Blob(chunks.current, { type: r.mimeType || "audio/webm" }), seconds: (Date.now() - started.current) / 1000 });
      };
      r.stop();
    });
  }

  function cancel() {
    const r = rec.current;
    if (r && r.state !== "inactive") {
      r.onstop = () => r.stream.getTracks().forEach((t) => t.stop());
      r.stop();
    }
    rec.current = null;
  }

  return { start, stop, cancel };
}

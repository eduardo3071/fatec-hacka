import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { usePanel } from "@/lib/panel-context";

export const Route = createFileRoute("/produtor/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · Colheita Certa" },
      { name: "description", content: "Entre com seu e-mail: mandamos um link, sem senha." },
      { property: "og:title", content: "Entrar · Colheita Certa" },
      { property: "og:description", content: "Entre com um link no seu e-mail." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { phase, live } = usePanel();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!live) navigate({ to: "/produtor", replace: true });
    else if (phase === "ready") navigate({ to: "/produtor/pedidos", replace: true });
    else if (phase === "no-profile") navigate({ to: "/produtor/cadastro", replace: true });
  }, [phase, live, navigate]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Confira o e-mail: parece faltar alguma coisa.");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/produtor/entrar` },
    });
    setSending(false);
    if (error) toast.error("Não consegui mandar o link agora. Tente de novo em instantes.");
    else setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-forest px-6 pb-10 pt-12 text-cream">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Logo variant="light" size={44} />
        {sent ? (
          <div className="mt-auto flex flex-col gap-4">
            <MailCheck className="size-14 text-amber" aria-hidden />
            <h1 className="font-display text-4xl font-bold">Veja seu e-mail</h1>
            <p className="text-lg text-cream/90">
              Mandamos um link para <strong>{email.trim()}</strong>. Toque nele neste celular para entrar.
            </p>
            <Button variant="outline" className="border-cream text-cream hover:bg-cream hover:text-forest" onClick={() => setSent(false)}>
              Usar outro e-mail
            </Button>
          </div>
        ) : (
          <form onSubmit={send} className="mt-auto flex flex-col gap-4">
            <h1 className="font-display text-4xl font-bold">Entrar</h1>
            <p className="text-lg text-cream/90">Sem senha: mandamos um link para o seu e-mail.</p>
            <label className="flex flex-col gap-2">
              <span className="text-base font-semibold">Seu e-mail</span>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="h-14 rounded-2xl border-2 border-line bg-paper text-lg text-ink"
              />
            </label>
            <Button type="submit" variant="amber" size="lg" className="h-16 text-xl" isLoading={sending}>
              <Mail /> Mandar link
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

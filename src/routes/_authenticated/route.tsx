import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { AlertTriangle, ArrowLeftRight, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { dentroDoAviso, sistemaEncerrado, tempoRestante } from "@/lib/encerramento";
import { limparSetorSelecionado, obterSetorSelecionado } from "@/lib/setores";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Antes de qualquer coisa: passado o prazo, nem a sessão vale mais.
    if (sistemaEncerrado()) throw redirect({ to: "/encerrado" });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: LayoutAutenticado,
});

function LayoutAutenticado() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Relê o setor a cada navegação para refletir a escolha feita em /setores.
  const setor = useMemo(() => obterSetorSelecionado(), [pathname]);

  // Documento em preparo não é salvo em lugar nenhum: quem está escrevendo
  // precisa ver o prazo se aproximando. O minuto a minuto vem de um relógio
  // próprio — sem ele a faixa só mudaria ao navegar.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function sair() {
    limparSetorSelecionado();
    await supabase.auth.signOut();
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="app-chrome border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/pacientes" className="text-base font-semibold text-foreground">
              Contingência CSV
            </Link>
            {setor && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {setor}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/setores">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Trocar setor
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={sair}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      {dentroDoAviso(agora) && (
        <div className="app-chrome border-b border-destructive/30 bg-destructive/10">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 text-sm text-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <span>
              {tempoRestante(agora) ? (
                <>
                  O acesso ao sistema encerrará em <strong>{tempoRestante(agora)}</strong>, a partir
                  do início do uso do Tasy.
                </>
              ) : (
                <>
                  O acesso ao sistema <strong>encerrará a qualquer momento</strong>, a partir do
                  início do uso do Tasy.
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

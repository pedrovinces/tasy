import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { limparSetorSelecionado, obterSetorSelecionado } from "@/lib/setores";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: LayoutAutenticado,
});

function LayoutAutenticado() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Relê o setor a cada navegação para refletir a escolha feita em /setores.
  const setor = useMemo(() => obterSetorSelecionado(), [pathname]);

  async function sair() {
    limparSetorSelecionado();
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="app-chrome border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/pacientes" className="text-base font-semibold text-foreground">
              Contingência UTI
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

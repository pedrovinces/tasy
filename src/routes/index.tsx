import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { sistemaEncerrado } from "@/lib/encerramento";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (sistemaEncerrado()) throw redirect({ to: "/encerrado" });
  },
  head: () => ({
    meta: [
      { title: "Contingência CSV — Evoluções e Receitas" },
      {
        name: "description",
        content:
          "Registro e impressão de evoluções clínicas e receitas da UTI durante a contingência do prontuário eletrônico.",
      },
      { property: "og:title", content: "Contingência CSV — Evoluções e Receitas" },
      {
        property: "og:description",
        content:
          "Registro e impressão de evoluções clínicas e receitas da UTI durante a contingência do prontuário eletrônico.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  // O desvio acontece aqui, depois que a sessão foi resolvida — e não no
  // beforeLoad. Jogar um redirect antes disso deixava a tela em branco em
  // conexão lenta, que é a do celular no plantão.
  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo) return;
      void navigate({ to: data.user ? "/pacientes" : "/login", replace: true });
    });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}

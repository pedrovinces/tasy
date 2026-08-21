import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contingência UTI — Evoluções e Receitas" },
      {
        name: "description",
        content:
          "Registro e impressão de evoluções clínicas e receitas da UTI durante a contingência do prontuário eletrônico.",
      },
      { property: "og:title", content: "Contingência UTI — Evoluções e Receitas" },
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

  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo) return;
      void navigate({ to: data.user ? "/pacientes" : "/auth", replace: true });
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

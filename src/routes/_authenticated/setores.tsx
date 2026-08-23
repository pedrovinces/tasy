import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { SETORES, definirSetorSelecionado, type Setor } from "@/lib/setores";

export const Route = createFileRoute("/_authenticated/setores")({
  head: () => ({
    meta: [
      { title: "Setores — Contingência CSV" },
      { name: "description", content: "Escolha do setor de trabalho na contingência." },
      { property: "og:title", content: "Setores — Contingência CSV" },
      { property: "og:description", content: "Escolha do setor de trabalho na contingência." },
    ],
  }),
  component: SelecaoSetor,
});

function SelecaoSetor() {
  const navigate = useNavigate();

  function escolher(setor: Setor) {
    definirSetorSelecionado(setor);
    void navigate({ to: "/pacientes" });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Escolha o setor</h1>
        <p className="text-sm text-muted-foreground">
          A listagem de pacientes mostrará apenas o setor escolhido.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {SETORES.map((setor) => (
          <button
            key={setor}
            type="button"
            onClick={() => escolher(setor)}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-6 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">{setor}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

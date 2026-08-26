import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  BedDouble,
  Bone,
  Building2,
  HeartPulse,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { setoresDoDominio } from "@/lib/dominios";
import {
  SETORES_INTERNACAO,
  SETOR_EMERGENCIA,
  definirSetorSelecionado,
  obterSetorSelecionado,
  type Setor,
} from "@/lib/setores";

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

// Cada setor com o ícone do que se faz nele: leito para as unidades de
// internação, traçado de monitor para as terapias intensivas, coração para a
// cardiointensiva, osso para o transplante de medula. Setor sem ícone próprio
// cai no prédio genérico.
const ICONES: Partial<Record<Setor, LucideIcon>> = {
  "UI I": BedDouble,
  "UI II": BedDouble,
  "UI III": BedDouble,
  "UTI Geral": Activity,
  "UTI Geral SS": Activity,
  USI: Stethoscope,
  UCI: HeartPulse,
  TMO: Bone,
  Emergência: Siren,
};

const CARTAO =
  "flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-6 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SelecaoSetor() {
  const navigate = useNavigate();
  const doDominio = setoresDoDominio();
  const unico = doDominio?.length === 1 ? (doDominio[0] ?? null) : null;
  const [verTodos, setVerTodos] = useState(false);
  const filtrado = doDominio !== null && !verTodos;

  // Endereço de uma unidade com um setor só não tem escolha a fazer: entra
  // direto na lista. Só na primeira vez, porém — quem chega aqui pelo "Trocar
  // setor" já tem setor escolhido e quer justamente trocá-lo. A decisão é
  // tomada uma vez, na montagem, para o próprio desvio não a mudar.
  //
  // O desvio acontece aqui, depois da montagem, e não na guarda da rota: feito
  // na guarda, ele dispara enquanto a verificação de sessão ainda está em
  // curso e a tela fica em branco até alguém recarregar.
  const [entrarDireto] = useState(() => unico !== null && obterSetorSelecionado() === null);

  useEffect(() => {
    if (!entrarDireto || unico === null) return;
    definirSetorSelecionado(unico);
    void navigate({ to: "/pacientes", replace: true });
  }, [entrarDireto, unico, navigate]);

  function escolher(setor: Setor) {
    definirSetorSelecionado(setor);
    void navigate({ to: "/pacientes" });
  }

  // Enquanto o desvio não acontece, nada de piscar a tela de escolha.
  if (entrarDireto) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Escolha o setor</h1>
        <p className="text-sm text-muted-foreground">
          {filtrado
            ? "Os setores deste endereço. A listagem de pacientes mostrará apenas o setor escolhido."
            : "A listagem de pacientes mostrará apenas o setor escolhido."}
        </p>
      </div>

      {filtrado ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {doDominio.map((setor) => {
              const Icone = ICONES[setor] ?? Building2;
              return (
                <button
                  key={setor}
                  type="button"
                  onClick={() => escolher(setor)}
                  className={CARTAO}
                >
                  <Icone className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{setor}</span>
                </button>
              );
            })}
          </div>

          {/* O endereço é atalho, não cerca: qualquer setor continua ao alcance. */}
          <button
            type="button"
            onClick={() => setVerTodos(true)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver todos os setores
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => escolher(SETOR_EMERGENCIA)}
            className="flex w-full items-center justify-center gap-3 rounded-lg border bg-card px-4 py-6 transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Siren className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">{SETOR_EMERGENCIA}</span>
          </button>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {SETORES_INTERNACAO.map((setor) => {
              const Icone = ICONES[setor] ?? Building2;
              return (
                <button
                  key={setor}
                  type="button"
                  onClick={() => escolher(setor)}
                  className={CARTAO}
                >
                  <Icone className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{setor}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

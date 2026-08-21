import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { Button } from "@/components/ui/button";
import { obterEvolucao } from "@/lib/documentos.functions";
import { formatarDataHora } from "@/lib/format";

const evolucaoQuery = (id: string) =>
  queryOptions({
    queryKey: ["evolucao-impressao", id],
    queryFn: () => obterEvolucao({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/imprimir/evolucao/$evolucaoId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(evolucaoQuery(params.evolucaoId)),
  head: () => ({
    meta: [
      { title: "Impressão de evolução — Contingência UTI" },
      { name: "description", content: "Folha de evolução clínica para impressão." },
      { property: "og:title", content: "Impressão de evolução — Contingência UTI" },
      { property: "og:description", content: "Folha de evolução clínica para impressão." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirEvolucao,
});

function ImprimirEvolucao() {
  const { evolucaoId } = Route.useParams();
  const { data } = useSuspenseQuery(evolucaoQuery(evolucaoId));

  if (!data || !data.paciente) return <NaoEncontrado />;
  const { evolucao, paciente } = data;

  return (
    <div>
      <div className="acoes-impressao mb-4 flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to="/pacientes/$pacienteId" params={{ pacienteId: paciente.id }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <FolhaA4
        paciente={paciente}
        titulo="Evolução Clínica"
        dataHora={formatarDataHora(evolucao.data_hora)}
      >
        {evolucao.texto.split("\n").map((paragrafo, indice) => (
          <p key={indice}>{paragrafo}</p>
        ))}
      </FolhaA4>
    </div>
  );
}

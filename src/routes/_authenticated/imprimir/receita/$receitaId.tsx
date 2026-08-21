import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { Button } from "@/components/ui/button";
import { obterReceita } from "@/lib/documentos.functions";
import { formatarDataHora } from "@/lib/format";

const receitaQuery = (id: string) =>
  queryOptions({
    queryKey: ["receita-impressao", id],
    queryFn: () => obterReceita({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/imprimir/receita/$receitaId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(receitaQuery(params.receitaId)),
  head: () => ({
    meta: [
      { title: "Impressão de receita — Contingência UTI" },
      { name: "description", content: "Folha de receita para impressão." },
      { property: "og:title", content: "Impressão de receita — Contingência UTI" },
      { property: "og:description", content: "Folha de receita para impressão." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirReceita,
});

function ImprimirReceita() {
  const { receitaId } = Route.useParams();
  const { data } = useSuspenseQuery(receitaQuery(receitaId));

  if (!data || !data.paciente) return <NaoEncontrado />;
  const { receita, itens, paciente } = data;

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

      <FolhaA4 paciente={paciente} titulo="Receita" dataHora={formatarDataHora(receita.data_hora)}>
        {receita.tipo === "itens" ? (
          <table className="folha-tabela-receita">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dose</th>
                <th>Via</th>
                <th>Frequência</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.medicamento}</td>
                  <td>{item.dose}</td>
                  <td>{item.via}</td>
                  <td>{item.frequencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          (receita.texto_livre ?? "").split("\n").map((paragrafo, indice) => (
            <p key={indice}>{paragrafo}</p>
          ))
        )}
      </FolhaA4>
    </div>
  );
}

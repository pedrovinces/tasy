import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Printer, ScrollText } from "lucide-react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarDocumentos } from "@/lib/documentos.functions";
import { calcularIdade, formatarData, formatarDataHora } from "@/lib/format";
import { obterPaciente } from "@/lib/pacientes.functions";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente({ data: { id } }),
  });

const documentosQuery = (id: string) =>
  queryOptions({
    queryKey: ["documentos", id],
    queryFn: () => listarDocumentos({ data: { paciente_id: id } }),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
      context.queryClient.ensureQueryData(documentosQuery(params.pacienteId)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Paciente — Contingência UTI" },
      { name: "description", content: "Evoluções e receitas do paciente em contingência." },
      { property: "og:title", content: "Paciente — Contingência UTI" },
      {
        property: "og:description",
        content: "Evoluções e receitas do paciente em contingência.",
      },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: FichaPaciente,
});

function FichaPaciente() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const { data: documentos } = useSuspenseQuery(documentosQuery(pacienteId));

  if (!paciente) return <NaoEncontrado />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-xl">{paciente.nome_completo}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Leito {paciente.leito} · {paciente.setor}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link
                to="/pacientes/$pacienteId/evolucao/nova"
                params={{ pacienteId: paciente.id }}
              >
                <ScrollText className="mr-2 h-4 w-4" />
                Nova evolução
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                to="/pacientes/$pacienteId/receita/nova"
                params={{ pacienteId: paciente.id }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Nova receita
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Filiação</dt>
              <dd className="font-medium text-foreground">{paciente.filiacao}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Nascimento</dt>
              <dd className="font-medium text-foreground">
                {formatarData(paciente.data_nascimento)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Idade</dt>
              <dd className="font-medium text-foreground">
                {calcularIdade(paciente.data_nascimento)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sexo</dt>
              <dd className="font-medium text-foreground">{paciente.sexo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Leito</dt>
              <dd className="font-medium text-foreground">{paciente.leito}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Setor</dt>
              <dd className="font-medium text-foreground">{paciente.setor}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Evoluções</h2>
        {documentos.evolucoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
        ) : (
          <div className="space-y-2">
            {documentos.evolucoes.map((evolucao) => (
              <div
                key={evolucao.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatarDataHora(evolucao.data_hora)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {evolucao.texto.slice(0, 140)}
                    {evolucao.texto.length > 140 ? "…" : ""}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/imprimir/evolucao/$evolucaoId" params={{ evolucaoId: evolucao.id }}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Receitas</h2>
        {documentos.receitas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma receita registrada.</p>
        ) : (
          <div className="space-y-2">
            {documentos.receitas.map((receita) => (
              <div
                key={receita.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatarDataHora(receita.data_hora)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {receita.tipo === "itens" ? "Receita em itens" : "Receita em texto livre"}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/imprimir/receita/$receitaId" params={{ receitaId: receita.id }}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

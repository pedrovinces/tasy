import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agoraParaInput } from "@/lib/format";
import { guardarDocumentoImpressao } from "@/lib/impressao-local";
import { obterPaciente } from "@/lib/pacientes";
import { evolucaoSchema } from "@/lib/schemas";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente(id),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/evolucao/nova")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Nova evolução — Contingência CSV" },
      { name: "description", content: "Registro de evolução clínica em contingência." },
      { property: "og:title", content: "Nova evolução — Contingência CSV" },
      { property: "og:description", content: "Registro de evolução clínica em contingência." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: NovaEvolucao,
});

function NovaEvolucao() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const navigate = useNavigate();
  const [dataHora, setDataHora] = useState(agoraParaInput());
  const [texto, setTexto] = useState("");

  if (!paciente) return <NaoEncontrado />;

  // A evolução não é salva em banco: vai direto para a folha de impressão e
  // é descartada ao sair dela.
  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const instante = new Date(dataHora);
    if (Number.isNaN(instante.getTime())) {
      toast.error("Informe uma data e hora válidas.");
      return;
    }
    const resultado = evolucaoSchema.safeParse({
      paciente_id: pacienteId,
      data_hora: instante.toISOString(),
      texto,
    });
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    try {
      const id = guardarDocumentoImpressao({
        tipo: "evolucao",
        paciente: paciente!,
        data_hora: resultado.data.data_hora,
        texto: resultado.data.texto,
      });
      toast.success("Evolução registrada. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/evolucao/$evolucaoId", params: { evolucaoId: id } });
    } catch (erro) {
      console.error("[impressão] falha ao preparar o documento", erro);
      toast.error("Não foi possível preparar a impressão.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <Button asChild variant="outline" size="icon" className="shrink-0">
            <Link to="/pacientes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar para a listagem</span>
            </Link>
          </Button>
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Nova evolução</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paciente do leito {paciente.leito} · {paciente.setor}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="data_hora">Data e hora</Label>
              <Input
                id="data_hora"
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="texto">Evolução</Label>
              <Textarea
                id="texto"
                rows={14}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Descreva a evolução clínica…"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit">Registrar evolução</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

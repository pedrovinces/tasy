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
import { criarEvolucao } from "@/lib/documentos.functions";
import { agoraParaInput } from "@/lib/format";
import { obterPaciente } from "@/lib/pacientes.functions";
import { evolucaoSchema } from "@/lib/schemas";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/evolucao/nova")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Nova evolução — Contingência UTI" },
      { name: "description", content: "Registro de evolução clínica em contingência." },
      { property: "og:title", content: "Nova evolução — Contingência UTI" },
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
  const [salvando, setSalvando] = useState(false);

  if (!paciente) return <NaoEncontrado />;

  async function salvar(evento: FormEvent) {
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
    setSalvando(true);
    try {
      const { id } = await criarEvolucao({ data: resultado.data });
      toast.success("Evolução registrada. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/evolucao/$evolucaoId", params: { evolucaoId: id } });
    } catch {
      toast.error("Não foi possível registrar a evolução.");
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nova evolução</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paciente do leito {paciente.leito} · {paciente.setor}
          </p>
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
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Registrar evolução"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

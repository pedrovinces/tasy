import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
import { prescricaoSchema, type PrescricaoItemInput } from "@/lib/schemas";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente(id),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/prescricao/nova")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Nova prescrição — Contingência CSV" },
      { name: "description", content: "Prescrição médica em contingência." },
      { property: "og:title", content: "Nova prescrição — Contingência CSV" },
      { property: "og:description", content: "Prescrição médica em contingência." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: NovaPrescricao,
});

const itemVazio: PrescricaoItemInput = { descricao: "", dose: "", via: "", frequencia: "" };

function NovaPrescricao() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const navigate = useNavigate();
  const [dataHora, setDataHora] = useState(agoraParaInput());
  const [alergias, setAlergias] = useState("");
  const [itens, setItens] = useState<PrescricaoItemInput[]>([{ ...itemVazio }]);

  if (!paciente) return <NaoEncontrado />;

  function atualizarItem(indice: number, campo: keyof PrescricaoItemInput, valor: string) {
    setItens((atuais) =>
      atuais.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)),
    );
  }

  // A prescrição não é salva em banco: vai direto para a folha de impressão e
  // é descartada ao sair dela.
  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const instante = new Date(dataHora);
    if (Number.isNaN(instante.getTime())) {
      toast.error("Informe uma data e hora válidas.");
      return;
    }
    const resultado = prescricaoSchema.safeParse({
      paciente_id: pacienteId,
      data_hora: instante.toISOString(),
      alergias,
      itens,
    });
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    try {
      const id = guardarDocumentoImpressao({
        tipo: "prescricao",
        paciente: paciente!,
        data_hora: resultado.data.data_hora,
        alergias: resultado.data.alergias?.trim() ? resultado.data.alergias : null,
        itens: resultado.data.itens,
      });
      toast.success("Prescrição pronta. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/prescricao/$prescricaoId", params: { prescricaoId: id } });
    } catch (erro) {
      console.error("[impressão] falha ao preparar o documento", erro);
      toast.error("Não foi possível preparar a impressão.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nova prescrição</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paciente do leito {paciente.leito} · {paciente.setor}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="alergias">Alergias</Label>
                <Input
                  id="alergias"
                  maxLength={500}
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  placeholder="Ex.: dipirona · deixe vazio para preencher à mão"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Plano terapêutico</Label>
                <p className="text-xs text-muted-foreground">
                  Uma linha por medicação ou ordem. Dose, via e frequência são opcionais — ordens
                  como “dieta zero” dispensam os três.
                </p>
              </div>

              {itens.map((item, indice) => (
                <div key={indice} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Item {indice + 1}</span>
                    {itens.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Remover item ${indice + 1}`}
                        onClick={() => setItens((atuais) => atuais.filter((_, i) => i !== indice))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`descricao-${indice}`}>Medicação ou ordem</Label>
                    {/* Ordens de diluição e velocidade de infusão são longas;
                        o campo cresce em vez de esconder o texto numa linha só. */}
                    <Textarea
                      id={`descricao-${indice}`}
                      rows={2}
                      maxLength={1000}
                      value={item.descricao}
                      onChange={(e) => atualizarItem(indice, "descricao", e.target.value)}
                      placeholder="Ex.: Dipirona · Cabeceira a 30°"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`dose-${indice}`}>Dose</Label>
                      <Input
                        id={`dose-${indice}`}
                        maxLength={200}
                        value={item.dose ?? ""}
                        onChange={(e) => atualizarItem(indice, "dose", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`via-${indice}`}>Via</Label>
                      <Input
                        id={`via-${indice}`}
                        maxLength={200}
                        value={item.via ?? ""}
                        onChange={(e) => atualizarItem(indice, "via", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`frequencia-${indice}`}>Frequência</Label>
                      <Input
                        id={`frequencia-${indice}`}
                        maxLength={200}
                        value={item.frequencia ?? ""}
                        onChange={(e) => atualizarItem(indice, "frequencia", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => setItens((atuais) => [...atuais, { ...itemVazio }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar item
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit">Imprimir prescrição</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

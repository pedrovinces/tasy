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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { criarReceita } from "@/lib/documentos.functions";
import { agoraParaInput } from "@/lib/format";
import { obterPaciente } from "@/lib/pacientes.functions";
import { receitaSchema, type ReceitaItemInput } from "@/lib/schemas";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/receita/nova")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Nova receita — Contingência UTI" },
      { name: "description", content: "Registro de receita em contingência." },
      { property: "og:title", content: "Nova receita — Contingência UTI" },
      { property: "og:description", content: "Registro de receita em contingência." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: NovaReceita,
});

const itemVazio: ReceitaItemInput = { medicamento: "", dose: "", via: "", frequencia: "" };

function NovaReceita() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const navigate = useNavigate();
  const [dataHora, setDataHora] = useState(agoraParaInput());
  const [tipo, setTipo] = useState<"itens" | "livre">("itens");
  const [itens, setItens] = useState<ReceitaItemInput[]>([{ ...itemVazio }]);
  const [textoLivre, setTextoLivre] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!paciente) return <NaoEncontrado />;

  function atualizarItem(indice: number, campo: keyof ReceitaItemInput, valor: string) {
    setItens((atuais) =>
      atuais.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)),
    );
  }

  function removerItem(indice: number) {
    setItens((atuais) => atuais.filter((_, i) => i !== indice));
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    const instante = new Date(dataHora);
    if (Number.isNaN(instante.getTime())) {
      toast.error("Informe uma data e hora válidas.");
      return;
    }
    const resultado = receitaSchema.safeParse({
      paciente_id: pacienteId,
      data_hora: instante.toISOString(),
      tipo,
      texto_livre: tipo === "livre" ? textoLivre : undefined,
      itens: tipo === "itens" ? itens : undefined,
    });
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setSalvando(true);
    try {
      const { id } = await criarReceita({ data: resultado.data });
      toast.success("Receita registrada. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/receita/$receitaId", params: { receitaId: id } });
    } catch {
      toast.error("Não foi possível registrar a receita.");
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nova receita</CardTitle>
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

            <div className="space-y-2">
              <Label>Formato da receita</Label>
              <RadioGroup
                value={tipo}
                onValueChange={(valor) => setTipo(valor as "itens" | "livre")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="itens" id="tipo-itens" />
                  <Label htmlFor="tipo-itens" className="font-normal">
                    Lista de medicamentos
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="livre" id="tipo-livre" />
                  <Label htmlFor="tipo-livre" className="font-normal">
                    Texto livre
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {tipo === "itens" ? (
              <div className="space-y-3">
                {itens.map((item, indice) => (
                  <div key={indice} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Item {indice + 1}
                      </span>
                      {itens.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label="Remover item"
                          onClick={() => removerItem(indice)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Medicamento</Label>
                      <Input
                        value={item.medicamento}
                        onChange={(e) => atualizarItem(indice, "medicamento", e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Dose</Label>
                        <Input
                          value={item.dose}
                          onChange={(e) => atualizarItem(indice, "dose", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Via</Label>
                        <Input
                          value={item.via}
                          onChange={(e) => atualizarItem(indice, "via", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Frequência</Label>
                        <Input
                          value={item.frequencia}
                          onChange={(e) => atualizarItem(indice, "frequencia", e.target.value)}
                          required
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
                  Adicionar medicamento
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="texto_livre">Receita</Label>
                <Textarea
                  id="texto_livre"
                  rows={12}
                  value={textoLivre}
                  onChange={(e) => setTextoLivre(e.target.value)}
                  placeholder="Escreva a prescrição completa…"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Registrar receita"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

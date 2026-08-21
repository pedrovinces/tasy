import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Pencil, Printer, ScrollText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarDocumentos } from "@/lib/documentos.functions";
import { calcularIdade, formatarData, formatarDataHora } from "@/lib/format";
import { atualizarLocalPaciente, obterPaciente } from "@/lib/pacientes.functions";
import { SETORES } from "@/lib/setores";

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
  const queryClient = useQueryClient();
  const [editAberto, setEditAberto] = useState(false);
  const [leito, setLeito] = useState("");
  const [setor, setSetor] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!paciente) return <NaoEncontrado />;

  function abrirEdicao() {
    setLeito(paciente!.leito);
    setSetor(paciente!.setor);
    setEditAberto(true);
  }

  async function salvarLocal(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await atualizarLocalPaciente({ data: { id: paciente!.id, leito, setor } });
      toast.success("Local do paciente atualizado.");
      setEditAberto(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
        queryClient.invalidateQueries({ queryKey: ["pacientes"] }),
      ]);
    } catch {
      toast.error("Não foi possível atualizar o local do paciente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className="shrink-0">
              <Link to="/pacientes">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para a listagem</span>
              </Link>
            </Button>
            <div>
              <CardTitle className="text-xl">{paciente.nome_completo}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Leito {paciente.leito} · {paciente.setor}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={editAberto} onOpenChange={setEditAberto}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={abrirEdicao}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar local
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar local do paciente</DialogTitle>
                  <DialogDescription>
                    Ao trocar o setor, o paciente passa a aparecer na listagem do novo setor.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={salvarLocal} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-leito">Leito</Label>
                    <Input
                      id="edit-leito"
                      value={leito}
                      onChange={(e) => setLeito(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Setor</Label>
                    <Select value={setor} onValueChange={setSetor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SETORES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={salvando}>
                    {salvando ? "Salvando…" : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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

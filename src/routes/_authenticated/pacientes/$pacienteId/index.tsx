import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, FileText, FlaskConical, Pencil, ScrollText } from "lucide-react";
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
import { calcularIdade, formatarData } from "@/lib/format";
import { atualizarPaciente, obterPaciente } from "@/lib/pacientes";
import { pacienteSchema } from "@/lib/schemas";
import { SETORES } from "@/lib/setores";
import { caixaAlta } from "@/lib/texto";

// Cartão de ação: alvo grande para o dedo, ícone acima do rótulo — o mesmo
// desenho da escolha de setor.
// Botões dentro do cartão escuro: contorno e texto claros, para não sumirem
// no fundo nem brigar com ele.
const BOTAO_NO_ESCURO =
  "shrink-0 border-background/30 bg-transparent text-background hover:bg-background/15 hover:text-background";

const ACAO =
  "flex flex-col items-center justify-center gap-2 rounded-lg border bg-card px-4 py-7 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente(id),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Paciente — Contingência CSV" },
      { name: "description", content: "Dados do paciente em contingência." },
      { property: "og:title", content: "Paciente — Contingência CSV" },
      {
        property: "og:description",
        content: "Dados do paciente em contingência.",
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
  const queryClient = useQueryClient();
  const [editAberto, setEditAberto] = useState(false);
  const [form, setForm] = useState({
    nome_completo: "",
    filiacao: "",
    data_nascimento: "",
    sexo: "",
    leito: "",
    setor: "",
  });
  const [salvando, setSalvando] = useState(false);

  if (!paciente) return <NaoEncontrado />;

  // O formulário é semeado a cada abertura, e não uma vez só: assim edições
  // sucessivas partem sempre do que está gravado, e um cancelamento não deixa
  // resto para a próxima vez.
  function abrirEdicao() {
    setForm({
      nome_completo: paciente!.nome_completo,
      filiacao: paciente!.filiacao,
      data_nascimento: paciente!.data_nascimento,
      sexo: paciente!.sexo,
      leito: paciente!.leito,
      setor: paciente!.setor,
    });
    setEditAberto(true);
  }

  async function salvarEdicao(evento: FormEvent) {
    evento.preventDefault();
    const resultado = pacienteSchema.safeParse(form);
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setSalvando(true);
    try {
      await atualizarPaciente({ id: paciente!.id, ...resultado.data });
      toast.success("Dados do paciente atualizados.");
      setEditAberto(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
        queryClient.invalidateQueries({ queryKey: ["pacientes"] }),
      ]);
    } catch {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* A folha impressa identifica o paciente em faixas escuras com letra
          branca; a tela repete isso. O bloco escuro é informação, os cartões
          claros abaixo são ação — a diferença fica óbvia antes de ler. */}
      <Card className="border-transparent bg-foreground text-background">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className={BOTAO_NO_ESCURO}>
              <Link to="/pacientes">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para a listagem</span>
              </Link>
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-background/60">
                Paciente
              </p>
              <CardTitle className="mt-0.5 text-xl">{paciente.nome_completo}</CardTitle>
              <p className="mt-1 text-sm text-background/70">
                Leito {paciente.leito} · {paciente.setor}
              </p>
            </div>
          </div>
          <Dialog open={editAberto} onOpenChange={setEditAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" className={BOTAO_NO_ESCURO} onClick={abrirEdicao}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar paciente</DialogTitle>
                <DialogDescription>
                  Corrija o que estiver errado no cadastro. Ao trocar o setor, o paciente passa a
                  aparecer na listagem do novo setor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={salvarEdicao} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-nome">Nome completo</Label>
                  <Input
                    id="edit-nome"
                    className="uppercase"
                    value={form.nome_completo}
                    onChange={(e) => setForm({ ...form, nome_completo: caixaAlta(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-filiacao">Filiação</Label>
                  <Input
                    id="edit-filiacao"
                    className="uppercase"
                    value={form.filiacao}
                    onChange={(e) => setForm({ ...form, filiacao: caixaAlta(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-nascimento">Data de nascimento</Label>
                    <Input
                      id="edit-nascimento"
                      type="date"
                      value={form.data_nascimento}
                      onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sexo</Label>
                    <Select
                      value={form.sexo}
                      onValueChange={(valor) => setForm({ ...form, sexo: valor })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-leito">Leito</Label>
                    <Input
                      id="edit-leito"
                      className="uppercase"
                      value={form.leito}
                      onChange={(e) => setForm({ ...form, leito: caixaAlta(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Setor</Label>
                    <Select
                      value={form.setor}
                      onValueChange={(valor) => setForm({ ...form, setor: valor })}
                    >
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
                </div>
                <Button type="submit" className="w-full" disabled={salvando}>
                  {salvando ? "Salvando…" : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Leito e setor já aparecem sob o nome: repeti-los aqui só fazia o
              cartão crescer. Sobram os dados que não estão em nenhum outro
              lugar da tela. */}
          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-background/70">Nascimento</dt>
              <dd className="font-medium">{formatarData(paciente.data_nascimento)}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-background/70">Idade</dt>
              <dd className="font-medium">{calcularIdade(paciente.data_nascimento)}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-background/70">Sexo</dt>
              <dd className="font-medium">{paciente.sexo}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-background/70">Filiação</dt>
              <dd className="font-medium">{paciente.filiacao}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Os quatro documentos são pares entre si — mesmo peso visual, mesmo
          desenho dos cartões da escolha de setor. O título nomeia o bloco como
          ação, em contraste com o cartão de informação acima. */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Documentos
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            to="/pacientes/$pacienteId/evolucao/nova"
            params={{ pacienteId: paciente.id }}
            className={ACAO}
          >
            <ScrollText className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold text-foreground">Nova evolução</span>
          </Link>
          <Link
            to="/pacientes/$pacienteId/prescricao/nova"
            params={{ pacienteId: paciente.id }}
            className={ACAO}
          >
            <ClipboardList className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold text-foreground">Nova prescrição</span>
          </Link>
          <Link
            to="/pacientes/$pacienteId/receita/nova"
            params={{ pacienteId: paciente.id }}
            className={ACAO}
          >
            <FileText className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold text-foreground">Nova receita</span>
          </Link>
          <Link
            to="/pacientes/$pacienteId/exames/nova"
            params={{ pacienteId: paciente.id }}
            className={ACAO}
          >
            <FlaskConical className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold text-foreground">Solicitar exames</span>
          </Link>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Nenhum destes documentos fica salvo: cada um abre direto na folha de impressão e é
        descartado ao sair dela.
      </p>
    </div>
  );
}

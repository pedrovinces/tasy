import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowRightLeft, Printer, Search, Trash2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcularIdade, formatarData } from "@/lib/format";
import { correspondeBusca, mesmaPessoa, palavrasDaBusca } from "@/lib/identificacao";
import {
  atualizarLocalPaciente,
  criarPaciente,
  desativarPaciente,
  listarPacientes,
} from "@/lib/pacientes";
import { pacienteSchema, type Paciente, type PacienteInput } from "@/lib/schemas";
import { obterSetorSelecionado, SETORES } from "@/lib/setores";
import { caixaAlta } from "@/lib/texto";

const pacientesQuery = queryOptions({
  queryKey: ["pacientes"],
  queryFn: () => listarPacientes(),
});

export const Route = createFileRoute("/_authenticated/pacientes/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pacientesQuery),
  head: () => ({
    meta: [
      { title: "Pacientes — Contingência CSV" },
      { name: "description", content: "Pacientes ativos da UTI em contingência." },
      { property: "og:title", content: "Pacientes — Contingência CSV" },
      { property: "og:description", content: "Pacientes ativos da UTI em contingência." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ListaPacientes,
});

const formInicial = {
  nome_completo: "",
  filiacao: "",
  data_nascimento: "",
  sexo: "",
  leito: "",
  setor: "",
};

function ListaPacientes() {
  const { data: pacientes } = useSuspenseQuery(pacientesQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setorAtual = obterSetorSelecionado();
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState({ ...formInicial, setor: setorAtual ?? "" });
  const [salvando, setSalvando] = useState(false);
  // Transferência em curso: vem de um paciente achado em outro setor pela
  // busca, ou do aviso de que o cadastro que se está digitando já existe.
  const [transferencia, setTransferencia] = useState<{
    paciente: Paciente;
    leito: string;
    dados: PacienteInput | null;
  } | null>(null);

  // Sem setor escolhido, a listagem não abre: volta para a escolha do setor.
  if (!setorAtual) return <Navigate to="/setores" replace />;

  const palavras = palavrasDaBusca(busca);
  const doSetor = pacientes.filter((p) => p.setor === setorAtual);
  const filtrados = doSetor.filter((p) => correspondeBusca(p, palavras));

  // Paciente transferido continua na lista do setor de origem, invisível para
  // quem o recebe — e o médico do destino acaba cadastrando de novo. Quem
  // busca e não acha aqui vê, logo abaixo, quem tem o mesmo nome em outro
  // setor, com um toque para trazer. Só com algo digitado: sem isso a tela
  // despejaria o hospital inteiro.
  const emOutroSetor =
    palavras.length === 0
      ? []
      : pacientes.filter((p) => p.setor !== setorAtual && correspondeBusca(p, palavras));

  async function salvarPaciente(evento: FormEvent) {
    evento.preventDefault();
    const resultado = pacienteSchema.safeParse(form);
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    // Rede de segurança para quem pulou a busca: se essa pessoa já está
    // cadastrada, o caminho oferecido é trazer o cadastro existente, não criar
    // um segundo. É aviso, não bloqueio — homônimo com a mesma data de
    // nascimento existe, e quem cadastra decide.
    const jaCadastrado = pacientes.find((p) => mesmaPessoa(p, resultado.data));
    if (jaCadastrado) {
      setTransferencia({
        paciente: jaCadastrado,
        leito: resultado.data.leito,
        dados: resultado.data,
      });
      return;
    }
    await gravarPaciente(resultado.data);
  }

  async function gravarPaciente(dados: PacienteInput) {
    setSalvando(true);
    try {
      await criarPaciente(dados);
      toast.success("Paciente cadastrado.");
      setTransferencia(null);
      setDialogAberto(false);
      setForm({ ...formInicial, setor: setorAtual ?? "" });
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    } catch {
      toast.error("Não foi possível cadastrar o paciente.");
    } finally {
      setSalvando(false);
    }
  }

  // Trazer é o mesmo cadastro mudando de lugar: troca setor e leito, não cria
  // linha nova. Assim o paciente sai da lista de origem no mesmo movimento.
  async function trazerParaCa() {
    if (!transferencia || !setorAtual) return;
    const { paciente, leito } = transferencia;
    if (leito.trim().length === 0) {
      toast.error("Informe o leito.");
      return;
    }
    setSalvando(true);
    try {
      await atualizarLocalPaciente({ id: paciente.id, leito, setor: setorAtual });
      toast.success(
        paciente.setor === setorAtual
          ? "Leito atualizado."
          : `Paciente trazido para ${setorAtual}.`,
      );
      setTransferencia(null);
      setDialogAberto(false);
      setBusca("");
      setForm({ ...formInicial, setor: setorAtual });
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    } catch {
      toast.error("Não foi possível trazer o paciente.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerDaLista(id: string) {
    try {
      await desativarPaciente(id);
      toast.success("Paciente removido da lista.");
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    } catch {
      toast.error("Não foi possível remover o paciente.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Pacientes <span className="text-muted-foreground">· {setorAtual}</span>
        </h1>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo paciente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar paciente</DialogTitle>
              <DialogDescription>
                Apenas os dados de identificação usados na folha de contingência.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={salvarPaciente} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome_completo">Nome completo</Label>
                <Input
                  id="nome_completo"
                  className="uppercase"
                  value={form.nome_completo}
                  onChange={(e) => setForm({ ...form, nome_completo: caixaAlta(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filiacao">Filiação</Label>
                <Input
                  id="filiacao"
                  className="uppercase"
                  value={form.filiacao}
                  onChange={(e) => setForm({ ...form, filiacao: caixaAlta(e.target.value) })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="data_nascimento">Data de nascimento</Label>
                  <Input
                    id="data_nascimento"
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
                  <Label htmlFor="leito">Leito</Label>
                  <Input
                    id="leito"
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
                      {SETORES.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={salvando}>
                {salvando ? "Salvando…" : "Cadastrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou leito…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {doSetor.length === 0
            ? `Nenhum paciente no setor ${setorAtual}. Use “Novo paciente” para começar.`
            : emOutroSetor.length > 0
              ? `Ninguém com esse nome em ${setorAtual}.`
              : "Nenhum paciente encontrado para a busca."}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leito</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="w-[1%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() =>
                    navigate({
                      to: "/pacientes/$pacienteId",
                      params: { pacienteId: p.id },
                    })
                  }
                >
                  <TableCell className="font-medium">{p.leito}</TableCell>
                  <TableCell>{p.nome_completo}</TableCell>
                  <TableCell>{formatarData(p.data_nascimento)}</TableCell>
                  <TableCell>{calcularIdade(p.data_nascimento)}</TableCell>
                  <TableCell>{p.sexo}</TableCell>
                  <TableCell>{p.setor}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" aria-label="Remover da lista">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover paciente da lista?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O paciente deixará de aparecer na lista de ativos. Os registros já
                              feitos são preservados — nenhum dado é apagado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removerDaLista(p.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {emOutroSetor.length > 0 && (
        <div className="rounded-md border border-dashed">
          <p className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Em outro setor
          </p>
          <ul className="divide-y">
            {emOutroSetor.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.setor} · leito {p.leito} · {calcularIdade(p.data_nascimento)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferencia({ paciente: p, leito: "", dados: null })}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Trazer para {setorAtual}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={transferencia !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setTransferencia(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transferencia?.dados ? "Este paciente já está cadastrado" : "Trazer paciente"}
            </DialogTitle>
            <DialogDescription>
              {transferencia === null
                ? null
                : transferencia.paciente.setor === setorAtual
                  ? `${transferencia.paciente.nome_completo} já está nesta lista, no leito ${transferencia.paciente.leito}.`
                  : `${transferencia.paciente.nome_completo} está em ${transferencia.paciente.setor}, leito ${transferencia.paciente.leito}. Trazer para ${setorAtual} muda o setor e o leito do mesmo cadastro — não cria um segundo.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="leito-transferencia">Leito em {setorAtual}</Label>
            <Input
              id="leito-transferencia"
              className="uppercase"
              value={transferencia?.leito ?? ""}
              onChange={(e) =>
                setTransferencia((atual) =>
                  atual === null ? atual : { ...atual, leito: caixaAlta(e.target.value) },
                )
              }
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={trazerParaCa} disabled={salvando}>
              {transferencia?.paciente.setor === setorAtual
                ? "Atualizar leito"
                : `Trazer para ${setorAtual}`}
            </Button>
            {transferencia?.dados ? (
              <Button
                variant="outline"
                disabled={salvando}
                onClick={() => {
                  const dados = transferencia.dados;
                  if (dados) void gravarPaciente(dados);
                }}
              >
                Cadastrar assim mesmo
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setTransferencia(null)} disabled={salvando}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Printer className="h-3.5 w-3.5" />
        Os documentos valem após impressão, assinatura e carimbo manuais na folha timbrada.
      </p>
    </div>
  );
}

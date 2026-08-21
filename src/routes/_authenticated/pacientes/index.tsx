import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Printer, Search, Trash2, UserPlus } from "lucide-react";
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
import {
  criarPaciente,
  desativarPaciente,
  listarPacientes,
} from "@/lib/pacientes.functions";
import { pacienteSchema } from "@/lib/schemas";
import { obterSetorSelecionado, SETORES } from "@/lib/setores";

const pacientesQuery = queryOptions({
  queryKey: ["pacientes"],
  queryFn: () => listarPacientes(),
});

export const Route = createFileRoute("/_authenticated/pacientes/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pacientesQuery),
  head: () => ({
    meta: [
      { title: "Pacientes — Contingência UTI" },
      { name: "description", content: "Pacientes ativos da UTI em contingência." },
      { property: "og:title", content: "Pacientes — Contingência UTI" },
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

  // Sem setor escolhido, a listagem não abre: volta para a escolha do setor.
  if (!setorAtual) return <Navigate to="/setores" replace />;

  const termo = busca.trim().toLowerCase();
  const doSetor = pacientes.filter((p) => p.setor === setorAtual);
  const filtrados = doSetor.filter(
    (p) =>
      termo.length === 0 ||
      p.nome_completo.toLowerCase().includes(termo) ||
      p.leito.toLowerCase().includes(termo),
  );

  async function salvarPaciente(evento: FormEvent) {
    evento.preventDefault();
    const resultado = pacienteSchema.safeParse(form);
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setSalvando(true);
    try {
      await criarPaciente({ data: resultado.data });
      toast.success("Paciente cadastrado.");
      setDialogAberto(false);
      setForm({ ...formInicial, setor: setorAtual });
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    } catch {
      toast.error("Não foi possível cadastrar o paciente.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerDaLista(id: string) {
    try {
      await desativarPaciente({ data: { id } });
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
                  value={form.nome_completo}
                  onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filiacao">Filiação</Label>
                <Input
                  id="filiacao"
                  value={form.filiacao}
                  onChange={(e) => setForm({ ...form, filiacao: e.target.value })}
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
                    value={form.leito}
                    onChange={(e) => setForm({ ...form, leito: e.target.value })}
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
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
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

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Printer className="h-3.5 w-3.5" />
        Os documentos valem após impressão, assinatura e carimbo manuais na folha timbrada.
      </p>
    </div>
  );
}

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EXAMES_IMAGEM, EXAMES_LABORATORIAIS, EXAMES_USUAIS, type GrupoExames } from "@/lib/exames";
import { agoraParaInput } from "@/lib/format";
import { guardarDocumentoImpressao } from "@/lib/impressao-local";
import { obterPaciente } from "@/lib/pacientes";
import { solicitacaoExamesSchema } from "@/lib/schemas";

const pacienteQuery = (id: string) =>
  queryOptions({
    queryKey: ["paciente", id],
    queryFn: () => obterPaciente(id),
  });

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId/exames/nova")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pacienteQuery(params.pacienteId)),
  head: () => ({
    meta: [
      { title: "Solicitação de exames — Contingência CSV" },
      { name: "description", content: "Solicitação de exames em contingência." },
      { property: "og:title", content: "Solicitação de exames — Contingência CSV" },
      { property: "og:description", content: "Solicitação de exames em contingência." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: NovaSolicitacao,
});

// Acentos atrapalham a busca por digitação: "cranio" precisa achar "crânio".
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filtrarGrupo(grupo: GrupoExames, busca: string): GrupoExames | null {
  if (!busca) return grupo;
  const alvo = normalizar(busca);
  const itens = grupo.itens.filter((item) => normalizar(item).includes(alvo));
  return itens.length > 0 ? { titulo: grupo.titulo, itens } : null;
}

function NovaSolicitacao() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const navigate = useNavigate();
  const [dataHora, setDataHora] = useState(agoraParaInput());
  const [indicacao, setIndicacao] = useState("");
  const [busca, setBusca] = useState("");
  const [outros, setOutros] = useState("");
  const [marcados, setMarcados] = useState<string[]>([]);

  const laboratoriais = useMemo(
    () =>
      [EXAMES_USUAIS, ...EXAMES_LABORATORIAIS]
        .map((grupo) => filtrarGrupo(grupo, busca))
        .filter((grupo): grupo is GrupoExames => grupo !== null),
    [busca],
  );
  const imagem = useMemo(() => filtrarGrupo(EXAMES_IMAGEM, busca), [busca]);
  const semResultado = laboratoriais.length === 0 && imagem === null;

  if (!paciente) return <NaoEncontrado />;

  function alternar(exame: string) {
    setMarcados((atuais) =>
      atuais.includes(exame) ? atuais.filter((e) => e !== exame) : [...atuais, exame],
    );
  }

  // A solicitação não é salva em banco: vai direto para a folha de impressão e
  // é descartada ao sair dela.
  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const instante = new Date(dataHora);
    if (Number.isNaN(instante.getTime())) {
      toast.error("Informe uma data e hora válidas.");
      return;
    }
    const resultado = solicitacaoExamesSchema.safeParse({
      paciente_id: pacienteId,
      data_hora: instante.toISOString(),
      indicacao,
      exames: marcados,
      outros,
    });
    if (!resultado.success) {
      toast.error(resultado.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    try {
      const id = guardarDocumentoImpressao({
        tipo: "solicitacao",
        paciente: paciente!,
        data_hora: resultado.data.data_hora,
        indicacao: resultado.data.indicacao,
        exames: resultado.data.exames,
        outros: resultado.data.outros?.trim() ? resultado.data.outros : null,
      });
      toast.success("Solicitação registrada. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/exames/$solicitacaoId", params: { solicitacaoId: id } });
    } catch {
      toast.error("Não foi possível preparar a impressão.");
    }
  }

  function renderizarGrupo(grupo: GrupoExames) {
    return (
      <fieldset key={grupo.titulo} className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">{grupo.titulo}</legend>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {grupo.itens.map((exame) => (
            <label
              key={exame}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={marcados.includes(exame)}
                onCheckedChange={() => alternar(exame)}
              />
              {exame}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Solicitação de exames</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paciente do leito {paciente.leito} · {paciente.setor}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-5">
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
              <Label htmlFor="indicacao">Indicação clínica</Label>
              <Textarea
                id="indicacao"
                rows={3}
                value={indicacao}
                onChange={(e) => setIndicacao(e.target.value)}
                placeholder="Motivo do pedido — sai impresso antes da lista de exames."
                required
              />
            </div>

            {/* A lista completa é longa. O resumo acompanha a rolagem para que o
                médico veja o que já marcou e possa gerar o documento de
                qualquer ponto da página, sem voltar ao fim do formulário. */}
            <div className="sticky top-2 z-10 rounded-md border bg-card p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {marcados.length === 0
                    ? "Nenhum exame marcado"
                    : `${marcados.length} exame${marcados.length > 1 ? "s" : ""} marcado${marcados.length > 1 ? "s" : ""}`}
                </span>
                <div className="flex items-center gap-2">
                  {marcados.length > 0 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setMarcados([])}>
                      Limpar
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={marcados.length === 0}>
                    Gerar solicitação
                  </Button>
                </div>
              </div>
              {marcados.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {marcados.map((exame) => (
                    <li key={exame}>
                      <button
                        type="button"
                        onClick={() => alternar(exame)}
                        aria-label={`Remover ${exame}`}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        {exame}
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="busca">Buscar exame</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="busca"
                  className="pl-9"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite parte do nome, ex.: creatinina, cranio…"
                />
              </div>
            </div>

            {semResultado ? (
              <p className="text-sm text-muted-foreground">
                Nenhum exame encontrado. Use o campo “Outros exames” abaixo.
              </p>
            ) : (
              <div className="space-y-5">
                {laboratoriais.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Laboratoriais
                    </h2>
                    {laboratoriais.map(renderizarGrupo)}
                  </section>
                )}
                {imagem && (
                  <section className="space-y-4">
                    <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Imagem
                    </h2>
                    {renderizarGrupo(imagem)}
                  </section>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="outros">Outros exames</Label>
              <Textarea
                id="outros"
                rows={2}
                value={outros}
                onChange={(e) => setOutros(e.target.value)}
                placeholder="O que não estiver na lista acima."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={marcados.length === 0}>
                Gerar solicitação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

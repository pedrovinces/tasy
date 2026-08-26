import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ehExameDeImagem,
  EXAMES_IMAGEM,
  EXAMES_LABORATORIAIS,
  type GrupoExames,
} from "@/lib/exames";
import { agoraParaInput } from "@/lib/format";
import { guardarDocumentoImpressao } from "@/lib/impressao-local";
import { obterPaciente } from "@/lib/pacientes";
import { solicitacaoExamesSchema } from "@/lib/schemas";
import { normalizarBusca } from "@/lib/texto";

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

function filtrarGrupo(grupo: GrupoExames, busca: string): GrupoExames | null {
  if (!busca) return grupo;
  const alvo = normalizarBusca(busca);
  const itens = grupo.itens.filter((item) => normalizarBusca(item).includes(alvo));
  return itens.length > 0 ? { titulo: grupo.titulo, itens } : null;
}

function NovaSolicitacao() {
  const { pacienteId } = Route.useParams();
  const { data: paciente } = useSuspenseQuery(pacienteQuery(pacienteId));
  const navigate = useNavigate();
  const [dataHora, setDataHora] = useState(agoraParaInput());
  const [indicacao, setIndicacao] = useState("");
  const [busca, setBusca] = useState("");
  const [outrosLaboratorio, setOutrosLaboratorio] = useState("");
  const [outrosImagem, setOutrosImagem] = useState("");
  const [marcados, setMarcados] = useState<string[]>([]);

  const laboratoriais = useMemo(
    () =>
      EXAMES_LABORATORIAIS.map((grupo) => filtrarGrupo(grupo, busca)).filter(
        (grupo): grupo is GrupoExames => grupo !== null,
      ),
    [busca],
  );
  const imagem = useMemo(() => filtrarGrupo(EXAMES_IMAGEM, busca), [busca]);
  const semResultado = laboratoriais.length === 0 && imagem === null;
  // Os dois blocos ficam lado a lado em tela larga: empilhados, a lista de
  // imagem caía depois de dezenas de itens de laboratório, longe de quem só
  // queria pedir um raio-X.

  // Laboratório e imagem viram folhas separadas, para seguirem para setores
  // diferentes. O resumo antecipa isso: quem marca já sabe quantas folhas vão
  // sair antes de mandar imprimir.
  const marcadosImagem = marcados.filter(ehExameDeImagem);
  const marcadosLaboratorio = marcados.filter((exame) => !ehExameDeImagem(exame));
  const temLaboratorio = marcadosLaboratorio.length > 0 || Boolean(outrosLaboratorio.trim());
  const temImagem = marcadosImagem.length > 0 || Boolean(outrosImagem.trim());
  const folhas = (temLaboratorio ? 1 : 0) + (temImagem ? 1 : 0);
  const resumo =
    folhas === 0
      ? "Nenhum exame marcado"
      : [
          marcadosLaboratorio.length > 0
            ? `${marcadosLaboratorio.length} ${marcadosLaboratorio.length > 1 ? "laboratoriais" : "laboratorial"}`
            : null,
          marcadosImagem.length > 0 ? `${marcadosImagem.length} de imagem` : null,
        ]
          .filter(Boolean)
          .join(" · ") + ` — ${folhas} folha${folhas > 1 ? "s" : ""}`;

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
      outros_laboratorio: outrosLaboratorio,
      outros_imagem: outrosImagem,
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
        outros_laboratorio: resultado.data.outros_laboratorio?.trim()
          ? resultado.data.outros_laboratorio
          : null,
        outros_imagem: resultado.data.outros_imagem?.trim() ? resultado.data.outros_imagem : null,
      });
      toast.success("Solicitação pronta. A folha de impressão vai abrir.");
      void navigate({ to: "/imprimir/exames/$solicitacaoId", params: { solicitacaoId: id } });
    } catch (erro) {
      console.error("[impressão] falha ao preparar o documento", erro);
      toast.error("Não foi possível preparar a impressão.");
    }
  }

  function renderizarGrupo(grupo: GrupoExames) {
    return (
      <fieldset key={grupo.titulo} className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">{grupo.titulo}</legend>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-1">
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
        <CardHeader className="flex flex-row items-start gap-4">
          <Button asChild variant="outline" size="icon" className="shrink-0">
            <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar para a ficha do paciente</span>
            </Link>
          </Button>
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Solicitação de exames</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paciente do leito {paciente.leito} · {paciente.setor}
            </p>
          </div>
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
                maxLength={2000}
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
                <span className="text-sm font-semibold text-foreground">{resumo}</span>
                <div className="flex items-center gap-2">
                  {marcados.length > 0 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setMarcados([])}>
                      Limpar
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={folhas === 0}>
                    Imprimir solicitação
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
              <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
                {laboratoriais.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Laboratoriais
                    </h2>
                    {laboratoriais.map(renderizarGrupo)}
                    <div className="space-y-1.5">
                      <Label htmlFor="outros-laboratorio">Outros exames laboratoriais</Label>
                      <Textarea
                        id="outros-laboratorio"
                        rows={2}
                        maxLength={1000}
                        value={outrosLaboratorio}
                        onChange={(e) => setOutrosLaboratorio(e.target.value)}
                        placeholder="O que não estiver na lista acima."
                      />
                    </div>
                  </section>
                )}
                {imagem && (
                  <section className="space-y-4">
                    <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Imagem
                    </h2>
                    {renderizarGrupo(imagem)}
                    <div className="space-y-1.5">
                      <Label htmlFor="outros-imagem">Outros exames de imagem</Label>
                      <Textarea
                        id="outros-imagem"
                        rows={2}
                        maxLength={1000}
                        value={outrosImagem}
                        onChange={(e) => setOutrosImagem(e.target.value)}
                        placeholder="O que não estiver na lista acima."
                      />
                    </div>
                  </section>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link to="/pacientes/$pacienteId" params={{ pacienteId }}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={folhas === 0}>
                Imprimir solicitação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

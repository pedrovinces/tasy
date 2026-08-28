import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, FileText, RefreshCw, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarEventos, type Evento } from "@/lib/eventos";
import { formatarDataHora } from "@/lib/format";
import { listarTodosPacientes } from "@/lib/pacientes";
import { SETORES } from "@/lib/setores";

const estatisticasQuery = queryOptions({
  queryKey: ["estatisticas"],
  queryFn: async () => {
    const [pacientes, eventos] = await Promise.all([listarTodosPacientes(), listarEventos()]);
    return { pacientes, eventos };
  },
  // Os números envelhecem rápido durante o plantão.
  staleTime: 30_000,
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(estatisticasQuery),
  head: () => ({
    meta: [
      { title: "Painel — Contingência CSV" },
      { name: "description", content: "Estatísticas de uso do sistema de contingência." },
      { property: "og:title", content: "Painel — Contingência CSV" },
      {
        property: "og:description",
        content: "Estatísticas de uso do sistema de contingência.",
      },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: Painel,
});

const NOME_DO_TIPO: Record<string, string> = {
  evolucao: "Evoluções",
  prescricao: "Prescrições",
  receita: "Receitas",
  solicitacao: "Solicitações de exames",
};

const TIPOS_DE_DOCUMENTO = Object.keys(NOME_DO_TIPO);

function inicioDaHora(instante: Date): Date {
  const hora = new Date(instante);
  hora.setMinutes(0, 0, 0);
  return hora;
}

function contarPorChave<T>(
  itens: readonly T[],
  chave: (item: T) => string | null,
): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    const valor = chave(item);
    if (valor === null) continue;
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }
  return contagem;
}

// Numa janela de 24 horas as duas pontas caem na mesma hora do relógio ("20h"
// e "20h"), o que faria parecer que o gráfico não anda. O dia entra no rótulo
// sempre que a janela atravessa a meia-noite.
function rotuloDaHora(hora: Date, comDia: boolean): string {
  const h = `${hora.getHours().toString().padStart(2, "0")}h`;
  if (!comDia) return h;
  const dia = `${hora.getDate().toString().padStart(2, "0")}/${(hora.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${dia} ${h}`;
}

function haQuantoTempo(instante: string | null): string {
  if (!instante) return "—";
  const minutos = Math.floor((Date.now() - new Date(instante).getTime()) / 60_000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return horas < 24 ? `há ${horas} h` : `há ${Math.floor(horas / 24)} d`;
}

function Painel() {
  const { data } = useSuspenseQuery(estatisticasQuery);
  const queryClient = useQueryClient();
  const [atualizando, setAtualizando] = useState(false);

  const { pacientes, eventos } = data;
  const ativos = pacientes.filter((p) => p.ativo);
  const removidos = pacientes.length - ativos.length;
  const ultimaAlteracao = pacientes.reduce<string | null>(
    (maior, p) => (maior === null || p.updated_at > maior ? p.updated_at : maior),
    null,
  );

  const documentos = eventos?.filter((e) => e.tipo !== "acesso") ?? [];
  const acessos = eventos?.filter((e) => e.tipo === "acesso") ?? [];

  // Início da contagem: o registro mais antigo que existe, seja um paciente ou
  // um evento. É o que define o eixo dos gráficos por hora — o painel mostra a
  // contingência inteira, não as últimas N horas.
  const primeiroRegistro = [
    ...pacientes.map((p) => p.created_at),
    ...(eventos ?? []).map((e) => e.criado_em),
  ].reduce<string | null>((menor, i) => (menor === null || i < menor ? i : menor), null);

  async function atualizar() {
    setAtualizando(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["estatisticas"] });
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Painel</h1>
          <p className="text-sm text-muted-foreground">
            {primeiroRegistro
              ? `Tudo desde o primeiro registro, em ${formatarDataHora(primeiroRegistro)}.`
              : "Nenhum registro ainda."}
          </p>
        </div>
        <Button variant="outline" onClick={atualizar} disabled={atualizando}>
          <RefreshCw className={`mr-2 h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          icone={Users}
          rotulo="Pacientes na lista"
          valor={ativos.length}
          detalhe={removidos > 0 ? `${removidos} removidos da lista` : "nenhum removido"}
        />
        <Numero
          icone={UserPlus}
          rotulo="Cadastrados no total"
          valor={pacientes.length}
          detalhe={`última alteração ${haQuantoTempo(ultimaAlteracao)}`}
        />
        <Numero
          icone={FileText}
          rotulo="Documentos gerados"
          valor={eventos === null ? null : documentos.length}
          detalhe={eventos === null ? "contagem não ligada" : "prontos para impressão"}
        />
        <Numero
          icone={Activity}
          rotulo="Entradas com senha"
          valor={eventos === null ? null : acessos.length}
          detalhe={eventos === null ? "contagem não ligada" : "cada vez que alguém entrou"}
        />
      </div>

      {eventos === null && <ContagemDesligada />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Barras
          titulo="Pacientes por setor"
          vazio="Nenhum paciente na lista."
          dados={SETORES.map((setor) => ({
            rotulo: setor,
            valor: ativos.filter((p) => p.setor === setor).length,
          })).filter((linha) => linha.valor > 0)}
        />
        {eventos !== null && (
          <Barras
            titulo="Documentos por tipo"
            vazio="Nenhum documento gerado ainda."
            dados={TIPOS_DE_DOCUMENTO.map((tipo) => ({
              rotulo: NOME_DO_TIPO[tipo] ?? tipo,
              valor: documentos.filter((e) => e.tipo === tipo).length,
            })).filter((linha) => linha.valor > 0)}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PorHora
          titulo="Pacientes cadastrados por hora"
          desde={primeiroRegistro}
          instantes={pacientes.map((p) => p.created_at)}
        />
        {eventos !== null && (
          <PorHora
            titulo="Documentos gerados por hora"
            desde={primeiroRegistro}
            instantes={documentos.map((e) => e.criado_em)}
          />
        )}
      </div>

      {eventos !== null && documentos.length > 0 && (
        <Barras
          titulo="Documentos por setor"
          vazio="Nenhum documento gerado ainda."
          dados={contagemPorSetor(documentos)}
        />
      )}
    </div>
  );
}

function contagemPorSetor(eventos: readonly Evento[]): { rotulo: string; valor: number }[] {
  const contagem = contarPorChave(eventos, (e) => e.setor ?? "Sem setor");
  return [...contagem.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function Numero({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
}: {
  icone: typeof Users;
  rotulo: string;
  valor: number | null;
  detalhe: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <span className="rounded-md bg-accent p-2 text-accent-foreground">
          <Icone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {rotulo}
          </p>
          {/* Número grande: é o que se lê de relance, antes de qualquer gráfico. */}
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {valor === null ? "—" : valor}
          </p>
          <p className="text-xs text-muted-foreground">{detalhe}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/*
 * Barras horizontais: o comprimento já diz a magnitude, então todas usam a
 * mesma cor — variar o tom por barra sugeriria uma segunda informação que não
 * existe. O valor vai escrito ao lado de cada uma, e não só no eixo, porque são
 * poucas barras e a leitura exata importa mais que a comparação fina.
 */
function Barras({
  titulo,
  dados,
  vazio,
}: {
  titulo: string;
  dados: readonly { rotulo: string; valor: number }[];
  vazio: string;
}) {
  const maior = dados.reduce((m, linha) => Math.max(m, linha.valor), 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>
        ) : (
          <ul className="space-y-2.5">
            {dados.map((linha) => (
              <li
                key={linha.rotulo}
                className="grid grid-cols-[minmax(6rem,11rem)_1fr_2.5rem] items-center gap-3"
              >
                <span className="truncate text-sm text-foreground" title={linha.rotulo}>
                  {linha.rotulo}
                </span>
                <span className="h-2.5 rounded-full bg-muted" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-[var(--chart-2)]"
                    style={{ width: `${maior === 0 ? 0 : (linha.valor / maior) * 100}%` }}
                  />
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {linha.valor}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/*
 * Colunas por hora. As horas vazias continuam desenhadas: um vão no meio do
 * gráfico é informação — foi uma hora sem movimento —, e omiti-las faria duas
 * pontas distantes parecerem vizinhas.
 */
function PorHora({
  titulo,
  desde,
  instantes,
}: {
  titulo: string;
  desde: string | null;
  instantes: readonly string[];
}) {
  if (desde === null) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">Nada registrado ainda.</p>
        </CardContent>
      </Card>
    );
  }
  const primeira = inicioDaHora(new Date(desde));
  const quantas = Math.floor((Date.now() - primeira.getTime()) / 3600_000) + 1;
  const baldes = Array.from({ length: quantas }, (_, i) => {
    const hora = new Date(primeira.getTime() + i * 3600_000);
    return { hora, valor: 0 };
  });
  for (const instante of instantes) {
    const indice = Math.floor((new Date(instante).getTime() - primeira.getTime()) / 3600_000);
    if (indice >= 0 && indice < baldes.length) baldes[indice]!.valor += 1;
  }
  const maior = baldes.reduce((m, b) => Math.max(m, b.valor), 0);
  const total = baldes.reduce((soma, b) => soma + b.valor, 0);
  const primeiro = baldes[0]?.hora;
  const ultimo = baldes.at(-1)?.hora;
  const viraODia = Boolean(primeiro && ultimo && primeiro.getDate() !== ultimo.getDate());

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nada registrado ainda.</p>
        ) : (
          <>
            <div className="flex h-28 items-end gap-0.5">
              {baldes.map((balde) => (
                <span
                  key={balde.hora.toISOString()}
                  className="flex-1 rounded-t-sm bg-[var(--chart-2)]"
                  style={{
                    height: `${maior === 0 ? 0 : Math.max(2, (balde.valor / maior) * 100)}%`,
                    opacity: balde.valor === 0 ? 0.18 : 1,
                  }}
                  title={`${rotuloDaHora(balde.hora, viraODia)} — ${balde.valor}`}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{primeiro && rotuloDaHora(primeiro, viraODia)}</span>
              <span className="font-medium text-foreground">{total} no período</span>
              <span>{ultimo && rotuloDaHora(ultimo, viraODia)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ContagemDesligada() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">A contagem de uso ainda não está ligada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Os números do banco acima são reais. Já os documentos gerados e as entradas com senha
          precisam de uma tabela que ainda não existe — sem ela o sistema não guarda nada disso, e
          mostrar zero pareceria que ninguém usou.
        </p>
        <p>
          Para ligar: abrir o arquivo{" "}
          <code className="text-foreground">supabase/seeds/eventos.sql</code> no repositório,{" "}
          <strong className="text-foreground">copiar o conteúdo dele</strong> e colar no SQL Editor
          do Supabase — o caminho do arquivo sozinho não é um comando. A tabela guarda apenas tipo,
          setor e hora, nunca dado de paciente, e a contagem passa a valer do momento em que for
          criada.
        </p>
      </CardContent>
    </Card>
  );
}

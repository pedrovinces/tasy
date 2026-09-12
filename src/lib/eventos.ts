// Contagem de uso: quantos acessos e quantos documentos, por hora e por setor.
//
// O que NÃO entra aqui: qualquer dado de paciente. A tabela tem três colunas —
// tipo, setor e hora — e é só isso que sai do navegador. O documento em si
// continua existindo apenas na sessão, até a impressão.
//
// O registro é sempre à parte do fluxo de trabalho: se falhar, falha em
// silêncio. Um painel de estatística não pode ser motivo para um médico não
// conseguir gerar uma receita.
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tabela `eventos` não está no types.ts — ele é gerado pelo Supabase e
// marcado para não ser editado à mão. O acesso a ela passa por uma visão sem
// tipagem de esquema; são duas consultas simples, cobertas por teste.
const banco = supabase as unknown as SupabaseClient;

// Os tipos são fechados de propósito: `tipo` é texto livre no banco, e uma
// lista explícita evita que um erro de digitação vire uma categoria nova e
// silenciosa no painel.
export const TIPOS_DE_DOCUMENTO = ["evolucao", "prescricao", "receita", "solicitacao"] as const;

export type TipoDocumento = (typeof TIPOS_DE_DOCUMENTO)[number];

export type TipoEvento =
  | "acesso"
  | TipoDocumento
  // Documento gerado é o que foi montado na tela; impressão é a caixa de
  // impressão tendo sido aberta e fechada. Contar os dois separa quem preencheu
  // de quem levou ao papel — e conta a reimpressão da mesma folha.
  | `impressao_${TipoDocumento}`
  | "paciente_criado"
  | "paciente_editado"
  | "paciente_removido"
  | "paciente_trazido";

export interface Evento {
  tipo: string;
  setor: string | null;
  criado_em: string;
  dominio?: string | null;
}

export function registrarEvento(tipo: TipoEvento, setor: string | null): void {
  // Sem await de propósito: quem chama segue adiante na mesma hora. O catch
  // vazio cobre os dois casos previstos — a tabela ainda não criada e a rede do
  // hospital oscilando —, e nenhum deles interessa a quem está atendendo.
  const dominio = typeof window === "undefined" ? null : window.location.hostname;
  void (async () => {
    try {
      const { error } = await banco.from("eventos").insert({ tipo, setor, dominio });
      // A coluna `dominio` chegou depois da tabela. Se ela ainda não existir no
      // banco, o registro vai sem — melhor perder o endereço do que perder a
      // contagem inteira até alguém rodar o alter table.
      if (error) await banco.from("eventos").insert({ tipo, setor });
    } catch {
      // Silêncio de propósito.
    }
  })();
}

/** "impressao_receita" → "receita"; qualquer outro tipo devolve null. */
export function documentoDaImpressao(tipo: string): TipoDocumento | null {
  const nome = tipo.startsWith("impressao_") ? tipo.slice("impressao_".length) : null;
  return (TIPOS_DE_DOCUMENTO as readonly string[]).includes(nome ?? "")
    ? (nome as TipoDocumento)
    : null;
}

/**
 * Todos os eventos, do primeiro ao último — o painel mostra a contingência
 * inteira, não uma janela móvel. Devolve `null` quando a tabela ainda não existe
 * no banco: o painel usa isso para explicar o que falta, em vez de mostrar zero
 * como se ninguém tivesse usado o sistema.
 */
export async function listarEventos(): Promise<Evento[] | null> {
  const { data, error } = await banco
    .from("eventos")
    .select("*")
    .order("criado_em", { ascending: true });
  if (error) {
    console.error("[eventos] listar falhou", { code: error.code, message: error.message });
    return null;
  }
  return (data ?? []) as Evento[];
}

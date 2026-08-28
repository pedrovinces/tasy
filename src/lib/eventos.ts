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

export type TipoEvento = "acesso" | "evolucao" | "prescricao" | "receita" | "solicitacao";

export interface Evento {
  tipo: string;
  setor: string | null;
  criado_em: string;
}

export function registrarEvento(tipo: TipoEvento, setor: string | null): void {
  // Sem await de propósito: quem chama segue adiante na mesma hora. O catch
  // vazio cobre os dois casos previstos — a tabela ainda não criada e a rede do
  // hospital oscilando —, e nenhum deles interessa a quem está atendendo.
  void (async () => {
    try {
      await banco.from("eventos").insert({ tipo, setor });
    } catch {
      // Silêncio de propósito.
    }
  })();
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
    .select("tipo, setor, criado_em")
    .order("criado_em", { ascending: true });
  if (error) {
    console.error("[eventos] listar falhou", { code: error.code, message: error.message });
    return null;
  }
  return (data ?? []) as Evento[];
}

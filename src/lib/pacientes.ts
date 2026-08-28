// Acesso à tabela `pacientes` direto do navegador.
//
// Antes estas funções rodavam no servidor (TanStack Start server functions),
// mas apenas repassavam a consulta ao Supabase usando o token do próprio
// usuário logado — a autorização sempre foi (e continua sendo) feita pelas
// políticas de RLS no banco. Com o app publicado como site estático não há
// servidor: o cliente Supabase do navegador envia o mesmo token e o RLS
// aplica exatamente as mesmas regras.
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { mesmaPessoa } from "./identificacao";
import { pacienteSchema, type Paciente, type PacienteInput } from "./schemas";
import { normalizarSetor, SETORES } from "./setores";
import { maiusculas } from "./texto";

const idSchema = z.string().uuid();

// A tela mostra uma mensagem curta ao usuário; o motivo real (código HTTP,
// texto do PostgREST, sessão expirada) só aparece no console. Nunca registra
// dado de paciente: o que vai para o log é o erro do Supabase, não a linha.
function falha(operacao: string, erro: PostgrestError, mensagem: string): Error {
  console.error(`[pacientes] ${operacao} falhou`, {
    code: erro.code,
    message: erro.message,
    details: erro.details,
    hint: erro.hint,
  });
  return new Error(mensagem);
}

const localSchema = z.object({
  id: idSchema,
  leito: z.string().trim().max(20).transform(maiusculas),
  setor: z.enum(SETORES, { message: "Selecione o setor" }),
});

// Duas correções aplicadas na saída, para cadastro antigo aparecer igual ao
// novo sem precisar ser refeito à mão:
//
// A identificação sobe para caixa alta — sexo fica de fora, que é lista
// fechada, e caixa alta não bateria com "Feminino".
//
// O setor passa pela tradução de nomes antigos (a UTI Geral SS virou UTI
// Geral): a listagem filtra por igualdade exata, então sem isso o paciente
// sumiria de todas as telas.
function normalizarPaciente(paciente: Paciente): Paciente {
  return {
    ...paciente,
    nome_completo: maiusculas(paciente.nome_completo),
    filiacao: maiusculas(paciente.filiacao),
    leito: maiusculas(paciente.leito),
    setor: normalizarSetor(paciente.setor),
  };
}

export async function listarPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("ativo", true)
    .order("leito", { ascending: true });
  if (error) throw falha("listar", error, "Não foi possível carregar os pacientes.");
  return ((data ?? []) as Paciente[]).map(normalizarPaciente);
}

/**
 * Todos os pacientes, inclusive os removidos da lista, para o painel de
 * estatísticas. A listagem do plantão continua trazendo só os ativos — quem
 * está atendendo não tem o que fazer com quem já saiu.
 */
export async function listarTodosPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw falha("listar todos", error, "Não foi possível carregar as estatísticas.");
  return ((data ?? []) as Paciente[]).map(normalizarPaciente);
}

export async function obterPaciente(id: string): Promise<Paciente | null> {
  const pacienteId = idSchema.parse(id);
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .maybeSingle();
  if (error) throw falha("obter", error, "Não foi possível carregar o paciente.");
  return data ? normalizarPaciente(data as Paciente) : null;
}

export async function criarPaciente(input: PacienteInput): Promise<{ id: string }> {
  const paciente = pacienteSchema.parse(input);
  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      nome_completo: paciente.nome_completo,
      filiacao: paciente.filiacao,
      data_nascimento: paciente.data_nascimento,
      sexo: paciente.sexo,
      leito: paciente.leito,
      setor: paciente.setor,
    })
    .select("id")
    .single();
  if (error) throw falha("criar", error, "Não foi possível cadastrar o paciente.");
  return { id: data.id as string };
}

/**
 * Procura outro cadastro ativo da mesma pessoa — mesmo nome e mesma data de
 * nascimento. `ignorarId` tira da busca quem está sendo editado, senão o
 * paciente acharia a si mesmo.
 *
 * A consulta é feita na hora, e não sobre a lista já carregada, porque a
 * correção pode acontecer muito depois de a tela ter aberto.
 */
export async function procurarMesmaPessoa(
  identidade: { nome_completo: string; data_nascimento: string },
  ignorarId?: string,
): Promise<Paciente | null> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("ativo", true)
    .eq("data_nascimento", identidade.data_nascimento);
  if (error)
    throw falha("procurar mesma pessoa", error, "Não foi possível verificar cadastros repetidos.");
  const candidatos = ((data ?? []) as Paciente[]).map(normalizarPaciente);
  return candidatos.find((p) => p.id !== ignorarId && mesmaPessoa(p, identidade)) ?? null;
}

// Correção de cadastro: nome digitado errado na pressa, data de nascimento
// trocada, filiação incompleta. Passa pelo mesmo schema do cadastro, então a
// identificação também sobe para caixa alta aqui.
export async function atualizarPaciente(input: { id: string } & PacienteInput) {
  const id = idSchema.parse(input.id);
  const paciente = pacienteSchema.parse(input);
  const { error } = await supabase
    .from("pacientes")
    .update({
      nome_completo: paciente.nome_completo,
      filiacao: paciente.filiacao,
      data_nascimento: paciente.data_nascimento,
      sexo: paciente.sexo,
      leito: paciente.leito,
      setor: paciente.setor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw falha("atualizar", error, "Não foi possível salvar as alterações.");
  return { ok: true };
}

// `setor` chega como string livre do formulário; o zod é quem estreita para a
// lista de setores válidos (e rejeita qualquer outro valor).
export async function atualizarLocalPaciente(input: { id: string; leito: string; setor: string }) {
  const { id, leito, setor } = localSchema.parse(input);
  const { error } = await supabase
    .from("pacientes")
    .update({ leito, setor, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error)
    throw falha("atualizar local", error, "Não foi possível atualizar o local do paciente.");
  return { ok: true };
}

export async function desativarPaciente(id: string) {
  const pacienteId = idSchema.parse(id);
  // Exclusão sempre lógica: nunca DELETE físico.
  const { error } = await supabase
    .from("pacientes")
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq("id", pacienteId);
  if (error) throw falha("desativar", error, "Não foi possível remover o paciente da lista.");
  return { ok: true };
}

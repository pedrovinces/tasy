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
import { pacienteSchema, type Paciente, type PacienteInput } from "./schemas";
import { SETORES } from "./setores";
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
  leito: z.string().trim().min(1, "Informe o leito").max(20).transform(maiusculas),
  setor: z.enum(SETORES, { message: "Selecione o setor" }),
});

// A identificação sobe para caixa alta também na saída, não só na gravação:
// quem foi cadastrado antes desta regra — ou inserido direto no banco — aparece
// igual a todo mundo, na lista, na ficha e no papel. Sexo e setor ficam de
// fora: são listas fechadas, e "UTI GERAL" não bateria com o setor escolhido.
function comIdentificacaoEmCaixaAlta(paciente: Paciente): Paciente {
  return {
    ...paciente,
    nome_completo: maiusculas(paciente.nome_completo),
    filiacao: maiusculas(paciente.filiacao),
    leito: maiusculas(paciente.leito),
  };
}

export async function listarPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("ativo", true)
    .order("leito", { ascending: true });
  if (error) throw falha("listar", error, "Não foi possível carregar os pacientes.");
  return ((data ?? []) as Paciente[]).map(comIdentificacaoEmCaixaAlta);
}

export async function obterPaciente(id: string): Promise<Paciente | null> {
  const pacienteId = idSchema.parse(id);
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .maybeSingle();
  if (error) throw falha("obter", error, "Não foi possível carregar o paciente.");
  return data ? comIdentificacaoEmCaixaAlta(data as Paciente) : null;
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

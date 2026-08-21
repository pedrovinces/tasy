// Acesso à tabela `pacientes` direto do navegador.
//
// Antes estas funções rodavam no servidor (TanStack Start server functions),
// mas apenas repassavam a consulta ao Supabase usando o token do próprio
// usuário logado — a autorização sempre foi (e continua sendo) feita pelas
// políticas de RLS no banco. Com o app publicado como site estático não há
// servidor: o cliente Supabase do navegador envia o mesmo token e o RLS
// aplica exatamente as mesmas regras.
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { pacienteSchema, type Paciente, type PacienteInput } from "./schemas";
import { SETORES } from "./setores";

const idSchema = z.string().uuid();

const localSchema = z.object({
  id: idSchema,
  leito: z.string().trim().min(1, "Informe o leito").max(20),
  setor: z.enum(SETORES, { message: "Selecione o setor" }),
});

export async function listarPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("ativo", true)
    .order("leito", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os pacientes.");
  return (data ?? []) as Paciente[];
}

export async function obterPaciente(id: string): Promise<Paciente | null> {
  const pacienteId = idSchema.parse(id);
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o paciente.");
  return (data ?? null) as Paciente | null;
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
  if (error) throw new Error("Não foi possível cadastrar o paciente.");
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
  if (error) throw new Error("Não foi possível atualizar o local do paciente.");
  return { ok: true };
}

export async function desativarPaciente(id: string) {
  const pacienteId = idSchema.parse(id);
  // Exclusão sempre lógica: nunca DELETE físico.
  const { error } = await supabase
    .from("pacientes")
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq("id", pacienteId);
  if (error) throw new Error("Não foi possível remover o paciente da lista.");
  return { ok: true };
}

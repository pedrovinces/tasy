import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pacienteSchema, type Paciente } from "./schemas";

export const listarPacientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("ativo", true)
      .order("leito", { ascending: true });
    if (error) throw new Error("Não foi possível carregar os pacientes.");
    return (data ?? []) as Paciente[];
  });

export const obterPaciente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar o paciente.");
    return (data ?? null) as Paciente | null;
  });

export const criarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pacienteSchema.parse(input))
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.supabase
      .from("pacientes")
      .insert({
        nome_completo: input.nome_completo,
        filiacao: input.filiacao,
        data_nascimento: input.data_nascimento,
        sexo: input.sexo,
        leito: input.leito,
        setor: input.setor,
      })
      .select("id")
      .single();
    if (error) throw new Error("Não foi possível cadastrar o paciente.");
    return { id: data.id as string };
  });

export const desativarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: input, context }) => {
    // Exclusão sempre lógica: nunca DELETE físico.
    const { error } = await context.supabase
      .from("pacientes")
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) throw new Error("Não foi possível remover o paciente da lista.");
    return { ok: true };
  });

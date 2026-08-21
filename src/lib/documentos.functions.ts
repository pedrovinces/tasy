import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  evolucaoSchema,
  receitaSchema,
  type Evolucao,
  type Paciente,
  type Receita,
  type ReceitaItem,
} from "./schemas";

export const listarDocumentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ paciente_id: z.string().uuid() }).parse(input))
  .handler(async ({ data: input, context }) => {
    const [evolucoesRes, receitasRes] = await Promise.all([
      context.supabase
        .from("evolucoes")
        .select("*")
        .eq("paciente_id", input.paciente_id)
        .order("data_hora", { ascending: false }),
      context.supabase
        .from("receitas")
        .select("*")
        .eq("paciente_id", input.paciente_id)
        .order("data_hora", { ascending: false }),
    ]);
    if (evolucoesRes.error || receitasRes.error) {
      throw new Error("Não foi possível carregar os documentos.");
    }
    return {
      evolucoes: (evolucoesRes.data ?? []) as Evolucao[],
      receitas: (receitasRes.data ?? []) as Receita[],
    };
  });

export const criarEvolucao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => evolucaoSchema.parse(input))
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.supabase
      .from("evolucoes")
      .insert({
        paciente_id: input.paciente_id,
        data_hora: input.data_hora,
        texto: input.texto,
      })
      .select("id")
      .single();
    if (error) throw new Error("Não foi possível registrar a evolução.");
    return { id: data.id as string };
  });

export const criarReceita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => receitaSchema.parse(input))
  .handler(async ({ data: input, context }) => {
    const { data: receita, error } = await context.supabase
      .from("receitas")
      .insert({
        paciente_id: input.paciente_id,
        tipo: input.tipo,
        data_hora: input.data_hora,
        texto_livre: input.tipo === "livre" ? (input.texto_livre ?? null) : null,
      })
      .select("id")
      .single();
    if (error) throw new Error("Não foi possível registrar a receita.");

    if (input.tipo === "itens" && input.itens && input.itens.length > 0) {
      const { error: erroItens } = await context.supabase.from("receita_itens").insert(
        input.itens.map((item, indice) => ({
          receita_id: receita.id,
          medicamento: item.medicamento,
          dose: item.dose,
          via: item.via,
          frequencia: item.frequencia,
          ordem: indice,
        })),
      );
      if (erroItens) throw new Error("Não foi possível registrar os itens da receita.");
    }
    return { id: receita.id as string };
  });

export const obterEvolucao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: input, context }) => {
    const { data: evolucao, error } = await context.supabase
      .from("evolucoes")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar a evolução.");
    if (!evolucao) return null;

    const { data: paciente } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("id", evolucao.paciente_id)
      .maybeSingle();

    return {
      evolucao: evolucao as Evolucao,
      paciente: (paciente ?? null) as Paciente | null,
    };
  });

export const obterReceita = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: input, context }) => {
    const { data: receita, error } = await context.supabase
      .from("receitas")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar a receita.");
    if (!receita) return null;

    const [pacienteRes, itensRes] = await Promise.all([
      context.supabase.from("pacientes").select("*").eq("id", receita.paciente_id).maybeSingle(),
      context.supabase
        .from("receita_itens")
        .select("*")
        .eq("receita_id", receita.id)
        .order("ordem", { ascending: true }),
    ]);

    return {
      receita: receita as Receita,
      itens: (itensRes.data ?? []) as ReceitaItem[],
      paciente: (pacienteRes.data ?? null) as Paciente | null,
    };
  });

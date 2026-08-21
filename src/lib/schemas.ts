import { z } from "zod";

import { SETORES } from "./setores";

// ---------------------------------------------------------------------------
// Tipos compartilhados (client-safe)
// ---------------------------------------------------------------------------

export interface Paciente {
  id: string;
  nome_completo: string;
  filiacao: string;
  data_nascimento: string;
  sexo: string;
  leito: string;
  setor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Evolucao {
  id: string;
  paciente_id: string;
  data_hora: string;
  texto: string;
  created_at: string;
}

export interface Receita {
  id: string;
  paciente_id: string;
  tipo: "itens" | "livre";
  data_hora: string;
  texto_livre: string | null;
  created_at: string;
}

export interface ReceitaItem {
  id: string;
  receita_id: string;
  medicamento: string;
  dose: string;
  via: string;
  frequencia: string;
  ordem: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Schemas de validação (usados no cliente e no servidor)
// ---------------------------------------------------------------------------

export const pacienteSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(200, "Nome muito longo"),
  filiacao: z
    .string()
    .trim()
    .min(3, "Informe a filiação")
    .max(200, "Filiação muito longa"),
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
  sexo: z.string().trim().min(1, "Informe o sexo").max(20),
  leito: z.string().trim().min(1, "Informe o leito").max(20),
  setor: z.enum(SETORES, { message: "Selecione o setor" }),
});

export type PacienteInput = z.infer<typeof pacienteSchema>;

export const evolucaoSchema = z.object({
  paciente_id: z.string().uuid("Paciente inválido"),
  data_hora: z.string().min(1, "Informe a data e a hora"),
  texto: z
    .string()
    .trim()
    .min(1, "Escreva a evolução")
    .max(20000, "Texto muito longo"),
});

export type EvolucaoInput = z.infer<typeof evolucaoSchema>;

export const receitaItemSchema = z.object({
  medicamento: z.string().trim().min(1, "Informe o medicamento").max(200),
  dose: z.string().trim().min(1, "Informe a dose").max(100),
  via: z.string().trim().min(1, "Informe a via").max(100),
  frequencia: z.string().trim().min(1, "Informe a frequência").max(100),
});

export type ReceitaItemInput = z.infer<typeof receitaItemSchema>;

export const receitaSchema = z
  .object({
    paciente_id: z.string().uuid("Paciente inválido"),
    data_hora: z.string().min(1, "Informe a data e a hora"),
    tipo: z.enum(["itens", "livre"]),
    texto_livre: z.string().trim().max(20000, "Texto muito longo").optional(),
    itens: z.array(receitaItemSchema).max(50, "Máximo de 50 itens").optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.tipo === "livre" && (!valor.texto_livre || valor.texto_livre.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escreva a receita",
        path: ["texto_livre"],
      });
    }
    if (valor.tipo === "itens" && (!valor.itens || valor.itens.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adicione ao menos um medicamento",
        path: ["itens"],
      });
    }
  });

export type ReceitaInput = z.infer<typeof receitaSchema>;

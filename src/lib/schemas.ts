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

// ---------------------------------------------------------------------------
// Schemas de validação (usados no cliente e no servidor)
// Documentos clínicos não têm tipo de banco: nunca são persistidos.
// ---------------------------------------------------------------------------

export const pacienteSchema = z.object({
  nome_completo: z.string().trim().min(3, "Informe o nome completo").max(200, "Nome muito longo"),
  filiacao: z.string().trim().min(3, "Informe a filiação").max(200, "Filiação muito longa"),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
  sexo: z.string().trim().min(1, "Informe o sexo").max(20, "Sexo muito longo"),
  leito: z.string().trim().min(1, "Informe o leito").max(20, "Leito muito longo"),
  setor: z.enum(SETORES, { message: "Selecione o setor" }),
});

export type PacienteInput = z.infer<typeof pacienteSchema>;

export const evolucaoSchema = z.object({
  paciente_id: z.string().uuid("Paciente inválido"),
  data_hora: z.string().min(1, "Informe a data e a hora"),
  texto: z.string().trim().min(1, "Escreva a evolução").max(20000, "Texto muito longo"),
});

export type EvolucaoInput = z.infer<typeof evolucaoSchema>;

export const receitaItemSchema = z.object({
  medicamento: z
    .string()
    .trim()
    .min(1, "Informe o medicamento")
    .max(300, "O medicamento deve ter no máximo 300 caracteres"),
  dose: z.string().trim().min(1, "Informe a dose").max(200, "Dose muito longa"),
  via: z.string().trim().min(1, "Informe a via").max(200, "Via muito longa"),
  frequencia: z.string().trim().min(1, "Informe a frequência").max(200, "Frequência muito longa"),
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

// Prescrição médica: a descrição sozinha atende ordens que não são medicação
// ("dieta zero", "cabeceira a 30°"); dose, via e frequência entram só quando
// fazem sentido, e são coladas na mesma linha impressa.
export const prescricaoItemSchema = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, "Informe a medicação ou a ordem")
    .max(1000, "A medicação ou ordem deve ter no máximo 1000 caracteres"),
  dose: z.string().trim().max(200, "A dose deve ter no máximo 200 caracteres").optional(),
  via: z.string().trim().max(200, "A via deve ter no máximo 200 caracteres").optional(),
  frequencia: z
    .string()
    .trim()
    .max(200, "A frequência deve ter no máximo 200 caracteres")
    .optional(),
});

export type PrescricaoItemInput = z.infer<typeof prescricaoItemSchema>;

export const prescricaoSchema = z.object({
  paciente_id: z.string().uuid("Paciente inválido"),
  data_hora: z.string().min(1, "Informe a data e a hora"),
  alergias: z.string().trim().max(500, "As alergias devem ter no máximo 500 caracteres").optional(),
  itens: z
    .array(prescricaoItemSchema)
    .min(1, "Adicione ao menos uma medicação ou ordem")
    .max(60, "Máximo de 60 itens"),
});

export type PrescricaoInput = z.infer<typeof prescricaoSchema>;

// Laboratório e imagem saem em folhas separadas, então o campo livre também é
// separado: escrever "RM de coluna" num campo genérico faria o pedido sair na
// folha do laboratório.
export const solicitacaoExamesSchema = z
  .object({
    paciente_id: z.string().uuid("Paciente inválido"),
    data_hora: z.string().min(1, "Informe a data e a hora"),
    indicacao: z
      .string()
      .trim()
      .min(1, "Escreva a indicação clínica")
      .max(2000, "Texto muito longo"),
    exames: z.array(z.string().trim().min(1)).max(120),
    outros_laboratorio: z.string().trim().max(1000, "Texto muito longo").optional(),
    outros_imagem: z.string().trim().max(1000, "Texto muito longo").optional(),
  })
  .superRefine((valor, ctx) => {
    const temTextoLivre = Boolean(valor.outros_laboratorio?.trim() || valor.outros_imagem?.trim());
    if (valor.exames.length === 0 && !temTextoLivre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Marque ao menos um exame ou escreva em “outros”",
        path: ["exames"],
      });
    }
  });

export type SolicitacaoExamesInput = z.infer<typeof solicitacaoExamesSchema>;

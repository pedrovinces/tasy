// Setores fixos da unidade. A escolha do setor fica na sessão do navegador
// (sessionStorage) — não é dado de paciente, apenas preferência de trabalho.

export const SETORES = [
  "Emergência",
  "UI I",
  "UI II",
  "UI III",
  "TMO",
  "USI",
  "UTI Geral",
  "UCI",
] as const;

export type Setor = (typeof SETORES)[number];

// A UTI Geral SS deixou de ser setor à parte: é a mesma UTI Geral, com outros
// leitos. Cadastro feito antes disso continua no banco com o nome antigo, e a
// listagem filtra por igualdade exata — sem esta tradução o paciente sumiria
// de todas as telas. O banco vai sendo corrigido conforme cada cadastro é
// salvo; a limpeza de uma vez está em supabase/seeds/unificar-uti-geral.sql.
const RENOMEADOS: Record<string, Setor> = {
  "UTI Geral SS": "UTI Geral",
};

export function normalizarSetor(setor: string): string {
  return RENOMEADOS[setor] ?? setor;
}

// A Emergência tem botão próprio no topo da tela de escolha, separado das
// unidades de internação. Fora dessa tela ela é um setor como qualquer outro:
// mesma validação, mesma listagem, mesmo comportamento dos pacientes.
export const SETOR_EMERGENCIA = "Emergência" satisfies Setor;

export const SETORES_INTERNACAO = SETORES.filter(
  (setor): setor is Exclude<Setor, typeof SETOR_EMERGENCIA> => setor !== SETOR_EMERGENCIA,
);

const CHAVE_SETOR = "contingencia.setor";

export function obterSetorSelecionado(): Setor | null {
  if (typeof window === "undefined") return null;
  const valor = window.sessionStorage.getItem(CHAVE_SETOR);
  return (SETORES as readonly string[]).includes(valor ?? "") ? (valor as Setor) : null;
}

export function definirSetorSelecionado(setor: Setor): void {
  window.sessionStorage.setItem(CHAVE_SETOR, setor);
}

export function limparSetorSelecionado(): void {
  window.sessionStorage.removeItem(CHAVE_SETOR);
}

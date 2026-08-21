// Setores fixos da unidade. A escolha do setor fica na sessão do navegador
// (sessionStorage) — não é dado de paciente, apenas preferência de trabalho.

export const SETORES = [
  "UI I",
  "UI II",
  "UI III",
  "TMO",
  "USI",
  "UTI Geral",
  "UTI Geral SS",
  "UCI",
] as const;

export type Setor = (typeof SETORES)[number];

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

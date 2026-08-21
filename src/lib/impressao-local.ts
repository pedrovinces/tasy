import type { Paciente, ReceitaItemInput } from "./schemas";

// ---------------------------------------------------------------------------
// Documentos clínicos NÃO são salvos na nuvem nem em qualquer banco de dados.
// Eles existem apenas nesta sessão do navegador, do preenchimento do
// formulário até a folha de impressão, e são descartados ao sair da folha
// (ou ao fechar a aba). Por isso o armazenamento é sessionStorage: nada
// permanece após a impressão.
// ---------------------------------------------------------------------------

export type DocumentoImpressao =
  | {
      tipo: "evolucao";
      paciente: Paciente;
      data_hora: string;
      texto: string;
    }
  | {
      tipo: "receita";
      paciente: Paciente;
      data_hora: string;
      formato: "itens" | "livre";
      texto_livre: string | null;
      itens: ReceitaItemInput[];
    };

const PREFIXO = "contingencia.impressao.";

export function guardarDocumentoImpressao(documento: DocumentoImpressao): string {
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(PREFIXO + id, JSON.stringify(documento));
  return id;
}

export function lerDocumentoImpressao(id: string): DocumentoImpressao | null {
  const bruto = window.sessionStorage.getItem(PREFIXO + id);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as DocumentoImpressao;
  } catch {
    return null;
  }
}

export function descartarDocumentoImpressao(id: string): void {
  window.sessionStorage.removeItem(PREFIXO + id);
}

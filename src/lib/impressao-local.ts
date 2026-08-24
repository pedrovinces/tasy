import type { Paciente, PrescricaoItemInput, ReceitaItemInput } from "./schemas";

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
    }
  | {
      tipo: "prescricao";
      paciente: Paciente;
      data_hora: string;
      alergias: string | null;
      itens: PrescricaoItemInput[];
    }
  | {
      tipo: "solicitacao";
      paciente: Paciente;
      data_hora: string;
      indicacao: string;
      exames: string[];
      outros: string | null;
    };

const PREFIXO = "contingencia.impressao.";

// O identificador é só a chave do documento nesta sessão do navegador — não
// protege nada e não sai daqui. Precisa, isso sim, existir em qualquer
// contexto: `crypto.randomUUID` só é oferecido em páginas seguras, e enquanto
// o site responder em http:// ele simplesmente não existe, derrubando a
// geração de todos os documentos. `getRandomValues` não tem essa restrição.
function novoIdDocumento(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function guardarDocumentoImpressao(documento: DocumentoImpressao): string {
  const id = novoIdDocumento();
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

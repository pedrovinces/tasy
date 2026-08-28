import type { Setor } from "./setores";

// Cada unidade tem o seu endereço, e quem entra por ele já chega no lugar
// certo: com um setor só, a tela de escolha nem aparece; com mais de um,
// aparecem apenas os daquela unidade.
//
// É atalho, não permissão. Nada no sistema muda conforme o domínio — os
// pacientes são os mesmos, e "Trocar setor" alcança todos os setores de
// qualquer endereço. Quem entra pelo endereço principal continua escolhendo
// entre todos, como antes.
const SETORES_POR_DOMINIO: Record<string, readonly Setor[]> = {
  "contingenciaemergcsv.com.br": ["Emergência"],
  "contingenciauicsv.com.br": ["UI I", "UI II", "UI III"],
  "contingenciauticsv.com.br": ["UTI Geral"],
  "contingenciausicsv.com.br": ["USI"],
  "contingenciaucicsv.com.br": ["UCI"],
  "contingenciatmocsv.com.br": ["TMO"],
};

// Devolve os setores do endereço de onde o sistema foi aberto, ou null quando
// o domínio não é de uma unidade específica (o principal, o endereço de teste
// da hospedagem, o servidor de desenvolvimento).
export function setoresDoDominio(host?: string): readonly Setor[] | null {
  const nome = host ?? (typeof window === "undefined" ? "" : window.location.hostname);
  // O ponto final é a forma absoluta do nome, válida na barra de endereço; o
  // "www." é a mesma unidade pelo outro caminho.
  const limpo = nome.toLowerCase().replace(/\.$/, "");
  const semWww = limpo.startsWith("www.") ? limpo.slice(4) : limpo;
  return SETORES_POR_DOMINIO[semWww] ?? null;
}

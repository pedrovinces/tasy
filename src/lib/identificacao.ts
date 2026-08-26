// Como o sistema decide que dois registros são a mesma pessoa, e como a busca
// da listagem casa o que foi digitado. Fica separado das telas porque a mesma
// regra vale em dois lugares: o filtro da lista e o aviso de cadastro repetido.
import type { Paciente } from "./schemas";
import { normalizarBusca } from "./texto";

/** Quebra o que foi digitado em palavras já sem acento e em minúsculas. */
export function palavrasDaBusca(busca: string): readonly string[] {
  return normalizarBusca(busca).split(/\s+/).filter(Boolean);
}

/**
 * Todas as palavras precisam aparecer no nome ou no leito, em qualquer ordem:
 * "joao silva" acha "JOÃO DA SILVA", e "3 joao" acha o João do leito 3.
 */
export function correspondeBusca(paciente: Paciente, palavras: readonly string[]): boolean {
  if (palavras.length === 0) return true;
  const alvo = normalizarBusca(`${paciente.nome_completo} ${paciente.leito}`);
  return palavras.every((palavra) => alvo.includes(palavra));
}

type Identidade = Pick<Paciente, "nome_completo" | "data_nascimento">;

/**
 * Mesma pessoa: nome igual ignorando acento e caixa, e mesma data de
 * nascimento. Nome sozinho acusaria homônimo; data de nascimento sozinha
 * acusaria meio andar. Juntos erram pouco — e mesmo assim o resultado é só um
 * aviso, nunca um bloqueio: homônimo com a mesma data existe, e travar o
 * cadastro no meio do plantão seria pior que a duplicata.
 */
export function mesmaPessoa(a: Identidade, b: Identidade): boolean {
  return (
    a.data_nascimento === b.data_nascimento &&
    normalizarBusca(a.nome_completo) === normalizarBusca(b.nome_completo)
  );
}

// Normalização de texto usada na busca e na identificação do paciente.
//
// São duas coisas diferentes e propositalmente separadas: para *comparar* o
// que foi digitado, acento e caixa atrapalham e são jogados fora; para
// *guardar e mostrar* o nome, o acento é parte do nome e fica — só a caixa
// sobe.

/**
 * Prepara um texto para comparação: tira acento e baixa para minúsculas.
 * "JOÃO GONÇALVES" e "joao goncalves" viram a mesma coisa.
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Sobe a caixa e mais nada. É o que se usa enquanto a pessoa digita: aparar as
 * pontas aqui comeria o espaço que ela acabou de teclar entre dois nomes.
 */
export function caixaAlta(texto: string): string {
  return texto.toLocaleUpperCase("pt-BR");
}

/**
 * Caixa alta para a identificação do paciente, como no papel oficial. Apara as
 * pontas e junta espaços repetidos, para "maria  souza " e "Maria Souza" não
 * virarem dois cadastros diferentes na tela. O acento é preservado: quem
 * procura por "joao" acha "JOÃO" porque quem compara é o normalizarBusca.
 */
export function maiusculas(texto: string): string {
  return caixaAlta(texto.trim().replace(/\s+/g, " "));
}

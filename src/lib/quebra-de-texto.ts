// Quebra de texto medida, para as folhas que se dividem em páginas.
//
// A impressão do sistema monta cada página explicitamente — é assim que o
// cabeçalho se repete e a contagem de páginas aparece no rodapé. Isso exige
// saber onde o texto quebra ANTES de montar as páginas, porque a unidade que
// migra de uma folha para a outra é a linha, não o parágrafo: uma evolução
// longa pode ser um parágrafo só, e ele não caberia em página nenhuma.

// Divide o texto na largura disponível, quebrando entre palavras. Uma palavra
// sozinha maior que a coluna (um nome comercial enorme, uma sequência de
// números) é partida no meio: perder texto de documento não é opção.
export function dividirEmLinhas(
  texto: string,
  largura: number,
  medir: (trecho: string) => number,
): string[] {
  if (largura <= 0 || medir(texto) <= largura) return [texto];

  const linhas: string[] = [];
  let atual = "";
  const empurrar = () => {
    if (atual) linhas.push(atual);
    atual = "";
  };

  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (medir(tentativa) <= largura) {
      atual = tentativa;
      continue;
    }

    empurrar();

    let resto = palavra;
    while (medir(resto) > largura && resto.length > 1) {
      let corte = resto.length;
      while (corte > 1 && medir(resto.slice(0, corte)) > largura) corte--;
      linhas.push(resto.slice(0, corte));
      resto = resto.slice(corte);
    }
    atual = resto;
  }

  empurrar();
  return linhas.length > 0 ? linhas : [texto];
}

// Mede contra o corpo real da folha: cria uma cópia invisível com as mesmas
// classes, lê a largura e a fonte que o CSS aplicou e devolve as linhas de
// cada parágrafo. Fora do navegador (ou se algo faltar), devolve o texto como
// está — a folha continua imprimindo, só sem a quebra calculada.
export function linhasDoCorpo(texto: string): string[][] {
  const paragrafos = texto.split("\n");
  if (typeof document === "undefined") return paragrafos.map((p) => [p]);

  const folha = document.createElement("div");
  folha.className = "folha-a4";
  folha.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden";
  const corpo = document.createElement("div");
  corpo.className = "folha-corpo";
  folha.appendChild(corpo);
  document.body.appendChild(folha);

  try {
    const contexto = document.createElement("canvas").getContext("2d");
    const estilo = window.getComputedStyle(corpo);
    const largura = corpo.clientWidth;
    if (!contexto || largura <= 0) return paragrafos.map((p) => [p]);

    contexto.font = `${estilo.fontStyle} ${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
    // Dois pixels de folga: a medida do canvas e a do texto na página não são
    // idênticas, e uma linha um fio mais larga seria requebrada pelo navegador
    // — o que estouraria a altura calculada para a página.
    const disponivel = largura - 2;

    return paragrafos.map((paragrafo) =>
      paragrafo.trim() === ""
        ? [""]
        : dividirEmLinhas(paragrafo, disponivel, (trecho) => contexto.measureText(trecho).width),
    );
  } finally {
    document.body.removeChild(folha);
  }
}

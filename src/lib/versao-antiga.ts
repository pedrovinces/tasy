// Versão nova publicada com a aba antiga aberta.
//
// O site é uma aplicação de página única: o índice que o navegador carregou
// aponta para pedaços de JavaScript por nome, e cada publicação renomeia esses
// pedaços. Quem estava com a aba aberta pede o arquivo antigo, que não existe
// mais, e a hospedagem devolve o índice no lugar dele — porque a regra de
// `public/_redirects` manda qualquer caminho desconhecido para a página
// inicial. O navegador recebe HTML onde esperava JavaScript e desiste.
//
// O médico no plantão não tem por que entender nada disso: a aba se atualiza
// sozinha. Fica aqui, e não nas telas de erro, porque a falha aparece em duas
// delas — a da rota e a da raiz —, dependendo de onde o pedaço era esperado.

// As mensagens variam por navegador; todas dizem a mesma coisa.
const SINAIS = [
  "is not a valid javascript mime type",
  "expected a javascript-or-wasm module script",
  "failed to load module script",
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "unexpected token '<'",
];

export function eVersaoAntiga(error: unknown): boolean {
  const mensagem = `${(error as Error)?.message ?? error}`.toLowerCase();
  return SINAIS.some((sinal) => mensagem.includes(sinal));
}

// Recarregar resolve, mas só uma vez: se o problema não for esse, um segundo
// recarregamento entraria em laço e a tela piscaria para sempre. A marca fica
// na aba, não no aparelho — abrir outra aba volta a ter direito a uma tentativa.
const MARCA = "contingencia.recarregado";

export function podeRecarregar(): boolean {
  try {
    return window.sessionStorage.getItem(MARCA) !== "1";
  } catch {
    // Navegação anônima com armazenamento bloqueado: sem marca não há como
    // evitar o laço, então nem se tenta — resta o aviso na tela.
    return false;
  }
}

export function recarregarNaVersaoNova(): void {
  try {
    window.sessionStorage.setItem(MARCA, "1");
  } catch {
    return;
  }
  // `reload()` pode reaproveitar o índice que está em cache — e é justamente o
  // índice velho que aponta para o pedaço que sumiu. Um endereço diferente
  // obriga o navegador a buscar tudo de novo.
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString(36));
  window.location.replace(url.toString());
}

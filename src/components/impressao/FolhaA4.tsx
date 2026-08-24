import { Children, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import "@/print/impressao.css";
import { calcularIdade, formatarData, formatarDataHora } from "@/lib/format";
import type { Paciente } from "@/lib/schemas";

interface FolhaA4Props {
  paciente: Paciente;
  titulo: string;
  dataHora: string;
  // Cada filho é um bloco indivisível do corpo: um parágrafo, uma linha de
  // texto, um item de exame. O componente reparte os blocos entre as páginas.
  children: ReactNode;
}

// Altura de conteúdo de uma página, em milímetros: os 288mm que a folha ocupa
// na impressão (ver impressao.css) menos as margens de cima e de baixo. É o
// orçamento que a repartição em páginas respeita.
const ALTURA_CONTEUDO_MM = 288 - 18;

function milimetroEmPixels(): number {
  const regua = document.createElement("div");
  regua.style.cssText = "position:absolute;visibility:hidden;height:100mm";
  document.body.appendChild(regua);
  const altura = regua.getBoundingClientRect().height / 100;
  document.body.removeChild(regua);
  return altura;
}

// Folha A4 com o timbrado oficial. CPF, DtHr Admissão, Prontuário, Registro,
// Matrícula e Convênio/Plano foram removidos do impresso por decisão do
// projeto — não aparecem nem como rótulos. Nome Social permanece vazio.
// Valores preenchidos seguem a foto de exemplo: caixa alta, fundo preto e
// letra branca.
//
// Documento de mais de uma página: o cabeçalho (timbrado, identificação do
// paciente e título) se repete em todas, a contagem aparece no rodapé de
// todas, e a assinatura com o rodapé institucional fecha o documento — só na
// última. Uma folha solta continua identificando o paciente e dizendo de que
// documento ela faz parte.
export function FolhaA4({ paciente, titulo, dataHora, children }: FolhaA4Props) {
  const impressoEm = formatarDataHora(new Date().toISOString());
  const blocos = Children.toArray(children);
  const todos = blocos.map((_, indice) => indice);

  const [paginas, setPaginas] = useState<number[][]>(() => [todos]);
  const precisaMedir = useRef(true);
  const refFolha = useRef<HTMLDivElement>(null);
  const refCorpo = useRef<HTMLDivElement>(null);
  const refEncerramento = useRef<HTMLDivElement>(null);
  const refNumeracao = useRef<HTMLParagraphElement>(null);

  // A repartição acontece antes da pintura: a primeira montagem serve de
  // medição, com tudo numa folha só, e o efeito de layout troca pelo resultado
  // já repartido. Quem está lendo a tela não chega a ver a versão comprida.
  useLayoutEffect(() => {
    if (!precisaMedir.current) return;
    const folha = refFolha.current;
    const corpo = refCorpo.current;
    const encerramento = refEncerramento.current;
    const numeracao = refNumeracao.current;
    if (!folha || !corpo || !encerramento || !numeracao) return;
    precisaMedir.current = false;

    const mm = milimetroEmPixels();
    if (mm <= 0) return;

    const estiloFolha = window.getComputedStyle(folha);
    const topoUtil = folha.getBoundingClientRect().top + parseFloat(estiloFolha.paddingTop);
    const alturaCabecalho = corpo.getBoundingClientRect().top - topoUtil;
    const alturaEncerramento = encerramento.getBoundingClientRect().height;
    const alturaNumeracao = numeracao.getBoundingClientRect().height;

    const util = ALTURA_CONTEUDO_MM * mm - alturaCabecalho - alturaNumeracao;
    if (util <= 0) return;

    // A altura de um bloco vai do topo dele ao topo do seguinte: assim a
    // margem entre os dois entra na conta uma vez só, mesmo quando as margens
    // se fundem. O último não tem seguinte — e o corpo se estica até o pé da
    // página —, então vale a altura dele mais a própria margem de baixo.
    const filhos = [...corpo.children] as HTMLElement[];
    const alturas = filhos.map((filho, indice) => {
      const seguinte = filhos[indice + 1];
      if (seguinte) return seguinte.getBoundingClientRect().top - filho.getBoundingClientRect().top;
      const margem = parseFloat(window.getComputedStyle(filho).marginBottom) || 0;
      return filho.getBoundingClientRect().height + margem;
    });

    const repartido: number[][] = [];
    let atual: number[] = [];
    let ocupado = 0;
    alturas.forEach((altura, indice) => {
      if (atual.length > 0 && ocupado + altura > util) {
        repartido.push(atual);
        atual = [];
        ocupado = 0;
      }
      atual.push(indice);
      ocupado += altura;
    });
    repartido.push(atual);

    // A última página carrega o encerramento no lugar da linha de contagem;
    // se o que sobrou não o comporta, os últimos blocos descem para uma folha
    // nova, em vez de o rodapé invadir o texto.
    // O encerramento ocupa, na última página, o lugar da linha de contagem. Se
    // não couber junto com o que ficou nela, o último bloco desce com ele —
    // apenas um, para não esvaziar a página anterior: assinatura logo abaixo
    // do texto vale mais que folha cheia. Quando nem assim cabe, o
    // encerramento vai sozinho para a folha seguinte.
    const aMais = alturaEncerramento - alturaNumeracao;
    const somar = (pagina: number[]) => pagina.reduce((total, i) => total + (alturas[i] ?? 0), 0);
    const ultima = repartido[repartido.length - 1];
    if (ultima && somar(ultima) + aMais > util) {
      const movido = ultima.length > 1 ? ultima[ultima.length - 1] : undefined;
      if (movido !== undefined && (alturas[movido] ?? 0) + aMais <= util) {
        ultima.pop();
        repartido.push([movido]);
      } else {
        repartido.push([]);
      }
    }

    setPaginas(
      repartido.filter((pagina, indice) => pagina.length > 0 || indice === repartido.length - 1),
    );
    // Roda a cada montagem do conjunto de páginas: é assim que a remedição
    // volta a acontecer quando o timbrado termina de carregar. O sinalizador
    // acima é que impede a repetição sem fim.
  }, [paginas]);

  // O timbrado é imagem: enquanto ela não carrega, o cabeçalho tem outra
  // altura e a conta sai errada. Ao terminar o carregamento, mede de novo.
  useEffect(() => {
    const folha = refFolha.current;
    if (!folha) return;
    const pendentes = [...folha.querySelectorAll("img")].filter((img) => !img.complete);
    if (pendentes.length === 0) return;

    let vivo = true;
    void Promise.all(
      pendentes.map(
        (img) =>
          new Promise<void>((resolver) => {
            img.addEventListener("load", () => resolver(), { once: true });
            img.addEventListener("error", () => resolver(), { once: true });
          }),
      ),
    ).then(() => {
      if (!vivo) return;
      precisaMedir.current = true;
      setPaginas([todos]);
    });

    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = paginas.length;
  const medindo = precisaMedir.current;

  return (
    <>
      {paginas.map((indices, pagina) => {
        const ultima = pagina === total - 1;
        return (
          <div
            key={pagina}
            ref={pagina === 0 ? refFolha : undefined}
            className={ultima ? "folha-a4" : "folha-a4 quebra-de-pagina"}
          >
            <header className="folha-cabecalho">
              <div className="folha-marca">
                {/* Servido de public/timbrado/: o timbre não pode depender de
                    uma CDN externa continuar no ar na hora de imprimir. */}
                <img src="/timbrado/logo-sao-vicente.png" alt="São Vicente — Rede D'Or" />
              </div>

              <section className="folha-identificacao">
                <div className="id-linha">
                  <span className="id-rotulo">Registro Civil:</span>
                  <span className="id-valor">{paciente.nome_completo}</span>
                </div>
                <div className="id-linha">
                  <span className="id-rotulo">Nome Social:</span>
                  <span className="id-valor vazio">.</span>
                </div>
                <div className="id-linha">
                  <span className="id-rotulo">Dt Nascimento:</span>
                  <span className="id-valor id-curto">
                    {formatarData(paciente.data_nascimento)}
                  </span>
                  <span className="id-rotulo">Idade:</span>
                  <span className="id-valor id-curto">
                    {calcularIdade(paciente.data_nascimento)}
                  </span>
                  <span className="id-rotulo">Sexo:</span>
                  <span className="id-valor id-curto">{paciente.sexo}</span>
                </div>
                <div className="id-linha">
                  <span className="id-rotulo">Filiação:</span>
                  <span className="id-valor">{paciente.filiacao}</span>
                </div>
                <div className="id-linha">
                  <span className="id-rotulo">Leito:</span>
                  <span className="id-valor id-curto">{paciente.leito}</span>
                </div>
                <div className="id-linha">
                  <span className="id-rotulo">Setor:</span>
                  <span className="id-valor">{paciente.setor}</span>
                </div>
              </section>
            </header>

            <h1 className="folha-titulo-barra">{titulo}</h1>
            <p className="folha-data">{dataHora}</p>

            <div className="folha-corpo" ref={pagina === 0 ? refCorpo : undefined}>
              {indices.map((indice) => blocos[indice])}
            </div>

            {/* Na medição a folha é uma só, então ela precisa carregar as duas
                peças ao mesmo tempo: o encerramento, para saber quanto ele
                ocupa, e a linha de contagem, escondida, pelo mesmo motivo. */}
            {(ultima || medindo) && (
              <div className="folha-encerramento" ref={pagina === 0 ? refEncerramento : undefined}>
                <div className="folha-linha-assinatura">Assinatura e carimbo</div>

                <footer className="folha-rodape">
                  <p className="rodape-slogan-rede">
                    Rede D'Or: a maior rede de saúde da América Latina
                  </p>
                  <p className="rodape-slogan-agende">
                    Agende consultas, exames e vacinas de forma prática e rápida
                  </p>

                  <div className="rodape-colunas">
                    <div className="rodape-coluna">
                      <div className="rodape-coluna-topo">
                        <img className="rodape-logo" src="/timbrado/logo-richet.png" alt="Richet" />
                        <img
                          className="rodape-qr"
                          src="/timbrado/qr-richet.png"
                          alt="QR code Richet"
                        />
                      </div>
                      <p className="rodape-site">www.richet.com.br</p>
                    </div>
                    <div className="rodape-coluna">
                      <div className="rodape-coluna-topo">
                        <img
                          className="rodape-logo"
                          src="/timbrado/logo-rede-dor.png"
                          alt="Rede D'Or"
                        />
                        <img
                          className="rodape-qr"
                          src="/timbrado/qr-rededor.png"
                          alt="QR code Rede D'Or"
                        />
                      </div>
                      <p className="rodape-site">www.rededor.com.br</p>
                    </div>
                  </div>

                  <p className="rodape-endereco">
                    HOSPITAIS INTEGRADOS DA GAVEA S/A - RUA JOAO BORGES nº 204 - GAVEA, RIO DE
                    JANEIRO - RJ CEP:22451100
                  </p>

                  <div className="rodape-final">
                    <span>{impressoEm}</span>
                    <span>Contatos: (21) 2529-4422</span>
                    <span>
                      Pág. {pagina + 1} de {total}
                    </span>
                  </div>
                </footer>
              </div>
            )}

            {!ultima && (
              <p className="folha-numeracao">
                Pág. {pagina + 1} de {total}
              </p>
            )}

            {medindo && pagina === 0 && (
              <p className="folha-numeracao folha-numeracao-medida" ref={refNumeracao} aria-hidden>
                Pág. 1 de 1
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

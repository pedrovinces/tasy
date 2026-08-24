import { useLayoutEffect, useRef, useState } from "react";

import "@/print/impressao.css";
import { calcularIdade, formatarData, formatarDataHora, formatarHora } from "@/lib/format";
import type { Paciente, PrescricaoItemInput } from "@/lib/schemas";

// Folha de prescrição em paisagem, espelhando o formulário oficial em papel:
// logo à esquerda, faixa do título ao centro, quadro de identificação à
// direita e a tabela de quatro colunas ocupando o resto da página.
//
// A coluna do relatório de enfermagem sai vazia de propósito: é onde a equipe
// anota à mão o horário de aplicação. Linhas em branco completam a página pelo
// mesmo motivo — o papel atual tem pauta até o rodapé.
//
// Campos que o papel traz mas o sistema não coleta (RG, Registro) ficam de
// fora: não são pedidos em lugar nenhum da interface.

interface FolhaPrescricaoProps {
  paciente: Paciente;
  // Instante da prescrição em ISO: as colunas Data e Hora precisam dele
  // separado, então a formatação acontece aqui dentro.
  dataHoraIso: string;
  alergias: string | null;
  itens: PrescricaoItemInput[];
}

// Quantas linhas a folha deitada comporta sem empurrar a assinatura para uma
// segunda página. O número saiu de medição — cabeçalho, tabela e rodapé somados
// contra os 210mm da página — com folga para uma linha longa que quebre em duas.
const LINHAS_POR_PAGINA = 15;

interface LinhaImpressa {
  texto: string;
  // Continuação de um item que não coube em uma linha. Sai sem data e hora:
  // repeti-las sugeriria uma segunda prescrição no mesmo horário.
  continuacao: boolean;
}

function montarLinha(item: PrescricaoItemInput): string {
  const complementos = [item.dose, item.via, item.frequencia].filter((parte): parte is string =>
    Boolean(parte && parte.trim()),
  );
  return complementos.length > 0
    ? `${item.descricao} — ${complementos.join(" · ")}`
    : item.descricao;
}

// Divide o texto na largura real da coluna, quebrando entre palavras. Uma
// palavra sozinha maior que a coluna (um nome comercial enorme, uma sequência
// de números) é partida no meio: perder texto de prescrição não é opção.
function dividirEmLinhas(
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

export function FolhaPrescricao({ paciente, dataHoraIso, alergias, itens }: FolhaPrescricaoProps) {
  // Emissão é o instante da impressão; as colunas repetem a data e a hora da
  // prescrição, que o médico escolhe no formulário.
  const emitidoEm = new Date().toISOString();
  const data = formatarData(dataHoraIso);
  const hora = formatarHora(dataHoraIso);

  const refColunaPlano = useRef<HTMLTableCellElement>(null);
  const [linhas, setLinhas] = useState<LinhaImpressa[]>(() =>
    itens.map((item) => ({ texto: montarLinha(item), continuacao: false })),
  );

  // A quebra usa a largura medida da coluna, não um número de caracteres
  // estimado: assim um item longo vira linhas seguintes da pauta, em vez de
  // engordar a linha onde está e desalinhar a tabela inteira.
  useLayoutEffect(() => {
    const celula = refColunaPlano.current;
    const contexto = document.createElement("canvas").getContext("2d");
    if (!celula || !contexto) return;

    const estilo = window.getComputedStyle(celula);
    const disponivel =
      celula.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    contexto.font = `${estilo.fontStyle} ${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;

    setLinhas(
      itens.flatMap((item) =>
        dividirEmLinhas(
          montarLinha(item),
          disponivel,
          (trecho) => contexto.measureText(trecho).width,
        ).map((texto, indice) => ({ texto, continuacao: indice > 0 })),
      ),
    );
  }, [itens]);

  const linhasVazias = Math.max(0, LINHAS_POR_PAGINA - linhas.length);

  return (
    <div className="folha-a4 folha-paisagem">
      <header className="prescricao-cabecalho">
        <div className="prescricao-marca">
          <img src="/timbrado/logo-sao-vicente.png" alt="São Vicente — Rede D'Or" />
        </div>

        <div className="prescricao-titulo-bloco">
          <div className="prescricao-faixa">Prescrição Médica</div>
          <p className="prescricao-alergia">
            <span>Alergia:</span>
            <span className="prescricao-alergia-valor">{alergias ?? ""}</span>
          </p>
        </div>

        <section className="prescricao-identificacao">
          <div className="id-linha">
            <span className="id-rotulo">Nome completo:</span>
            <span className="id-valor">{paciente.nome_completo}</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Filiação:</span>
            <span className="id-valor">{paciente.filiacao}</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Nascimento:</span>
            <span className="id-valor id-curto">{formatarData(paciente.data_nascimento)}</span>
            <span className="id-rotulo">Idade:</span>
            <span className="id-valor id-curto">{calcularIdade(paciente.data_nascimento)}</span>
            <span className="id-rotulo">Sexo:</span>
            <span className="id-valor id-curto">{paciente.sexo}</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Leito:</span>
            <span className="id-valor id-curto">{paciente.leito}</span>
            <span className="id-rotulo">Unidade de origem:</span>
            <span className="id-valor">{paciente.setor}</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Data de emissão:</span>
            <span className="id-valor">{formatarDataHora(emitidoEm)}</span>
          </div>
        </section>
      </header>

      <table className="prescricao-tabela">
        <thead>
          <tr>
            <th className="col-data">Data</th>
            <th className="col-hora">Hora</th>
            <th>Plano terapêutico</th>
            <th>
              Relatório de enfermagem
              <br />
              <span className="cabecalho-secundario">Horário aplicação medicamento</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, indice) => (
            <tr key={indice}>
              <td className="col-data">{linha.continuacao ? "" : data}</td>
              <td className="col-hora">{linha.continuacao ? "" : hora}</td>
              <td ref={indice === 0 ? refColunaPlano : undefined}>{linha.texto}</td>
              <td />
            </tr>
          ))}
          {Array.from({ length: linhasVazias }, (_, indice) => (
            <tr key={`vazia-${indice}`} className="linha-vazia">
              <td className="col-data">&nbsp;</td>
              <td className="col-hora">&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="prescricao-rodape">
        <div className="folha-linha-assinatura">Assinatura e carimbo</div>
        <p className="prescricao-emissao">Prescrição de {formatarDataHora(dataHoraIso)}</p>
      </div>
    </div>
  );
}

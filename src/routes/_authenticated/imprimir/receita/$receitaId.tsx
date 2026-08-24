import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { AcoesImpressao } from "@/components/impressao/AcoesImpressao";
import { formatarDataHora } from "@/lib/format";
import { linhasDoCorpo } from "@/lib/quebra-de-texto";
import {
  descartarDocumentoImpressao,
  lerDocumentoImpressao,
  type DocumentoImpressao,
} from "@/lib/impressao-local";

// Quantos medicamentos cabem num trecho de tabela. Dezoito ocupam pouco mais
// da metade da área útil da página: um trecho sempre cabe inteiro, e dois
// nunca cabem na mesma folha.
const ITENS_POR_TRECHO = 18;

export const Route = createFileRoute("/_authenticated/imprimir/receita/$receitaId")({
  head: () => ({
    meta: [
      { title: "Impressão de receita — Contingência CSV" },
      { name: "description", content: "Folha de receita para impressão." },
      { property: "og:title", content: "Impressão de receita — Contingência CSV" },
      { property: "og:description", content: "Folha de receita para impressão." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirReceita,
});

function ImprimirReceita() {
  const { receitaId } = Route.useParams();
  // O documento vive apenas nesta sessão do navegador — nada vai para a nuvem.
  const [documento] = useState<DocumentoImpressao | null>(() => lerDocumentoImpressao(receitaId));

  // Ao sair da folha, o documento é descartado: não fica salvo em lugar nenhum.
  useEffect(() => () => descartarDocumentoImpressao(receitaId), [receitaId]);

  // Abre a caixa de impressão automaticamente quando a folha termina de
  // carregar (imagens do timbrado).
  useEffect(() => {
    if (!documento) return;
    let cancelado = false;
    let disparado = false;
    const disparar = () => {
      if (cancelado || disparado) return;
      disparado = true;
      window.print();
    };
    const quandoCarregar = () => window.setTimeout(disparar, 300);
    if (document.readyState === "complete") {
      quandoCarregar();
    } else {
      window.addEventListener("load", quandoCarregar, { once: true });
    }
    const fallback = window.setTimeout(disparar, 2000);
    return () => {
      cancelado = true;
      window.clearTimeout(fallback);
      window.removeEventListener("load", quandoCarregar);
    };
  }, [documento]);

  // Receita escrita à mão livre segue o mesmo caminho da evolução: linhas
  // medidas, para poder continuar na página seguinte.
  const paragrafos = useMemo(
    () =>
      documento?.tipo === "receita" && documento.formato !== "itens"
        ? linhasDoCorpo(documento.texto_livre ?? "")
        : [],
    [documento],
  );

  // Em lista de medicamentos, o bloco que não pode ser partido é a tabela.
  // Cortá-la em trechos curtos deixa cada um caber inteiro numa página — e
  // como dois trechos não cabem juntos, o cabeçalho da tabela nunca se repete
  // no meio da folha.
  const trechos = useMemo(() => {
    if (documento?.tipo !== "receita" || documento.formato !== "itens") return [];
    const grupos: (typeof documento.itens)[] = [];
    for (let inicio = 0; inicio < documento.itens.length; inicio += ITENS_POR_TRECHO) {
      grupos.push(documento.itens.slice(inicio, inicio + ITENS_POR_TRECHO));
    }
    return grupos;
  }, [documento]);

  if (!documento || documento.tipo !== "receita") return <NaoEncontrado />;
  const { paciente } = documento;

  return (
    <div>
      <AcoesImpressao pacienteId={paciente.id} documento="A receita" />

      <FolhaA4
        paciente={paciente}
        titulo="Receita"
        dataHora={formatarDataHora(documento.data_hora)}
      >
        {documento.formato === "itens"
          ? trechos.map((itens, trecho) => (
              <table className="folha-tabela-receita" key={trecho}>
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Dose</th>
                    <th>Via</th>
                    <th>Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, indice) => (
                    <tr key={indice}>
                      <td>{item.medicamento}</td>
                      <td>{item.dose}</td>
                      <td>{item.via}</td>
                      <td>{item.frequencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))
          : paragrafos.flatMap((linhas, paragrafo) =>
              linhas.map((linha, indice) => (
                <p
                  key={`${paragrafo}-${indice}`}
                  className={
                    indice === linhas.length - 1 ? "folha-linha fim-de-paragrafo" : "folha-linha"
                  }
                >
                  {linha}
                </p>
              )),
            )}
      </FolhaA4>
    </div>
  );
}

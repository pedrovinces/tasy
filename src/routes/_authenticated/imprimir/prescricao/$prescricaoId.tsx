import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaPrescricao } from "@/components/impressao/FolhaPrescricao";
import { AcoesImpressao } from "@/components/impressao/AcoesImpressao";
import {
  descartarDocumentoImpressao,
  lerDocumentoImpressao,
  type DocumentoImpressao,
} from "@/lib/impressao-local";

export const Route = createFileRoute("/_authenticated/imprimir/prescricao/$prescricaoId")({
  head: () => ({
    meta: [
      { title: "Impressão de prescrição — Contingência CSV" },
      { name: "description", content: "Folha de prescrição médica para impressão." },
      { property: "og:title", content: "Impressão de prescrição — Contingência CSV" },
      { property: "og:description", content: "Folha de prescrição médica para impressão." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirPrescricao,
});

function ImprimirPrescricao() {
  const { prescricaoId } = Route.useParams();
  // O documento vive apenas nesta sessão do navegador — nada vai para a nuvem.
  const [documento] = useState<DocumentoImpressao | null>(() =>
    lerDocumentoImpressao(prescricaoId),
  );

  // Ao sair da folha, o documento é descartado: não fica salvo em lugar nenhum.
  useEffect(() => () => descartarDocumentoImpressao(prescricaoId), [prescricaoId]);

  // Abre a caixa de impressão automaticamente quando a folha termina de
  // carregar (imagem do timbrado).
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

  if (!documento || documento.tipo !== "prescricao") return <NaoEncontrado />;
  const { paciente } = documento;

  return (
    <div>
      {/*
       * A folha de estilo define A4 retrato para todos os documentos. Esta é a
       * única em paisagem, então a regra vem daqui: declarada depois, vale
       * enquanto esta rota está montada e não altera evolução, receita nem
       * solicitação de exames.
       */}
      <style>{"@page { size: A4 landscape; margin: 0; }"}</style>

      <AcoesImpressao pacienteId={paciente.id} documento="A prescrição" />

      <FolhaPrescricao
        paciente={paciente}
        dataHoraIso={documento.data_hora}
        alergias={documento.alergias}
        itens={documento.itens}
      />
    </div>
  );
}

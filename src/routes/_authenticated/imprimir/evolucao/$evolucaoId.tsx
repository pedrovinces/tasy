import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { AcoesImpressao } from "@/components/impressao/AcoesImpressao";
import { formatarDataHora } from "@/lib/format";
import {
  descartarDocumentoImpressao,
  lerDocumentoImpressao,
  type DocumentoImpressao,
} from "@/lib/impressao-local";

export const Route = createFileRoute("/_authenticated/imprimir/evolucao/$evolucaoId")({
  head: () => ({
    meta: [
      { title: "Impressão de evolução — Contingência CSV" },
      { name: "description", content: "Folha de evolução multiprofissional para impressão." },
      { property: "og:title", content: "Impressão de evolução — Contingência CSV" },
      {
        property: "og:description",
        content: "Folha de evolução multiprofissional para impressão.",
      },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirEvolucao,
});

function ImprimirEvolucao() {
  const { evolucaoId } = Route.useParams();
  // O documento vive apenas nesta sessão do navegador — nada vai para a nuvem.
  const [documento] = useState<DocumentoImpressao | null>(() => lerDocumentoImpressao(evolucaoId));

  // Ao sair da folha, o documento é descartado: não fica salvo em lugar nenhum.
  useEffect(() => () => descartarDocumentoImpressao(evolucaoId), [evolucaoId]);

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

  if (!documento || documento.tipo !== "evolucao") return <NaoEncontrado />;
  const { paciente } = documento;

  return (
    <div>
      <AcoesImpressao pacienteId={paciente.id} documento="A evolução" />

      <FolhaA4
        paciente={paciente}
        titulo="Evolução Multiprofissional"
        dataHora={formatarDataHora(documento.data_hora)}
      >
        {documento.texto.split("\n").map((paragrafo, indice) => (
          <p key={indice}>{paragrafo}</p>
        ))}
      </FolhaA4>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { Button } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/format";
import {
  descartarDocumentoImpressao,
  lerDocumentoImpressao,
  type DocumentoImpressao,
} from "@/lib/impressao-local";

export const Route = createFileRoute("/_authenticated/imprimir/receita/$receitaId")({
  head: () => ({
    meta: [
      { title: "Impressão de receita — Contingência UTI" },
      { name: "description", content: "Folha de receita para impressão." },
      { property: "og:title", content: "Impressão de receita — Contingência UTI" },
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
  const [documento] = useState<DocumentoImpressao | null>(() =>
    lerDocumentoImpressao(receitaId),
  );

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

  if (!documento || documento.tipo !== "receita") return <NaoEncontrado />;
  const { paciente } = documento;

  return (
    <div>
      <div className="acoes-impressao mb-4 flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to="/pacientes/$pacienteId" params={{ pacienteId: paciente.id }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <FolhaA4
        paciente={paciente}
        titulo="Receita"
        dataHora={formatarDataHora(documento.data_hora)}
      >
        {documento.formato === "itens" ? (
          <table className="folha-tabela-receita">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dose</th>
                <th>Via</th>
                <th>Frequência</th>
              </tr>
            </thead>
            <tbody>
              {documento.itens.map((item, indice) => (
                <tr key={indice}>
                  <td>{item.medicamento}</td>
                  <td>{item.dose}</td>
                  <td>{item.via}</td>
                  <td>{item.frequencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          (documento.texto_livre ?? "").split("\n").map((paragrafo, indice) => (
            <p key={indice}>{paragrafo}</p>
          ))
        )}
      </FolhaA4>
    </div>
  );
}

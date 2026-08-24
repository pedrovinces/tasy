import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";

import { ErroRota, NaoEncontrado } from "@/components/ErroRota";
import { FolhaA4 } from "@/components/impressao/FolhaA4";
import { Button } from "@/components/ui/button";
import { ehExameDeImagem } from "@/lib/exames";
import { formatarDataHora } from "@/lib/format";
import {
  descartarDocumentoImpressao,
  lerDocumentoImpressao,
  type DocumentoImpressao,
} from "@/lib/impressao-local";

export const Route = createFileRoute("/_authenticated/imprimir/exames/$solicitacaoId")({
  head: () => ({
    meta: [
      { title: "Impressão de solicitação de exames — Contingência CSV" },
      { name: "description", content: "Folha de solicitação de exames para impressão." },
      { property: "og:title", content: "Impressão de solicitação de exames — Contingência CSV" },
      { property: "og:description", content: "Folha de solicitação de exames para impressão." },
    ],
  }),
  errorComponent: ErroRota,
  notFoundComponent: NaoEncontrado,
  component: ImprimirSolicitacao,
});

function ImprimirSolicitacao() {
  const { solicitacaoId } = Route.useParams();
  // O documento vive apenas nesta sessão do navegador — nada vai para a nuvem.
  const [documento] = useState<DocumentoImpressao | null>(() =>
    lerDocumentoImpressao(solicitacaoId),
  );

  // Ao sair da folha, o documento é descartado: não fica salvo em lugar nenhum.
  useEffect(() => () => descartarDocumentoImpressao(solicitacaoId), [solicitacaoId]);

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

  if (!documento || documento.tipo !== "solicitacao") return <NaoEncontrado />;
  const { paciente } = documento;

  const imagem = documento.exames.filter(ehExameDeImagem);
  const laboratoriais = documento.exames.filter((exame) => !ehExameDeImagem(exame));

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
        titulo="Solicitação de Exames"
        dataHora={formatarDataHora(documento.data_hora)}
      >
        <p className="exames-indicacao">
          <strong>Indicação: </strong>
          {documento.indicacao}
        </p>

        {laboratoriais.length > 0 && (
          <section className="exames-grupo">
            <h2 className="exames-grupo-titulo">Exames laboratoriais</h2>
            <ul className="exames-lista">
              {laboratoriais.map((exame) => (
                <li key={exame}>• {exame}</li>
              ))}
            </ul>
          </section>
        )}

        {imagem.length > 0 && (
          <section className="exames-grupo">
            <h2 className="exames-grupo-titulo">Exames de imagem</h2>
            <ul className="exames-lista">
              {imagem.map((exame) => (
                <li key={exame}>• {exame}</li>
              ))}
            </ul>
          </section>
        )}

        {documento.outros && (
          <section className="exames-grupo">
            <h2 className="exames-grupo-titulo">Outros</h2>
            <p>{documento.outros}</p>
          </section>
        )}
      </FolhaA4>
    </div>
  );
}

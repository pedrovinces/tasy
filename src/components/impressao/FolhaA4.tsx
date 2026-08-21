import type { ReactNode } from "react";

import "@/print/impressao.css";
import { calcularIdade, formatarData, formatarDataHora } from "@/lib/format";
import type { Paciente } from "@/lib/schemas";

interface FolhaA4Props {
  paciente: Paciente;
  titulo: string;
  dataHora: string;
  children: ReactNode;
}

// Folha A4 com o timbrado oficial. CPF, DtHr Admissão, Prontuário, Registro,
// Matrícula e Convênio/Plano foram removidos do impresso por decisão do
// projeto — não aparecem nem como rótulos. Nome Social permanece vazio.
// Valores preenchidos seguem a foto de exemplo: caixa alta, fundo preto e
// letra branca.
export function FolhaA4({ paciente, titulo, dataHora, children }: FolhaA4Props) {
  const impressoEm = formatarDataHora(new Date().toISOString());

  return (
    <div className="folha-a4">
      <header className="folha-cabecalho">
        <div className="folha-marca">
          {/* Servido de public/timbrado/: o timbre não pode depender de uma
              CDN externa continuar no ar na hora de imprimir. Os logos do
              rodapé ainda apontam para a CDN e precisam do mesmo tratamento. */}
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
            <span className="id-valor id-curto">{formatarData(paciente.data_nascimento)}</span>
            <span className="id-rotulo">Idade:</span>
            <span className="id-valor id-curto">{calcularIdade(paciente.data_nascimento)}</span>
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

      <div className="folha-corpo">{children}</div>

      <div className="folha-linha-assinatura">Assinatura e carimbo</div>

      <footer className="folha-rodape">
        <p className="rodape-slogan-rede">Rede D'Or: a maior rede de saúde da América Latina</p>
        <p className="rodape-slogan-agende">
          Agende consultas, exames e vacinas de forma prática e rápida
        </p>

        <div className="rodape-colunas">
          <div className="rodape-coluna">
            <div className="rodape-coluna-topo">
              <img className="rodape-logo" src="/timbrado/logo-richet.png" alt="Richet" />
              <img className="rodape-qr" src="/timbrado/qr-richet.png" alt="QR code Richet" />
            </div>
            <p className="rodape-site">www.richet.com.br</p>
          </div>
          <div className="rodape-coluna">
            <div className="rodape-coluna-topo">
              <img className="rodape-logo" src="/timbrado/logo-rede-dor.png" alt="Rede D'Or" />
              <img className="rodape-qr" src="/timbrado/qr-rededor.png" alt="QR code Rede D'Or" />
            </div>
            <p className="rodape-site">www.rededor.com.br</p>
          </div>
        </div>

        <p className="rodape-endereco">
          HOSPITAIS INTEGRADOS DA GAVEA S/A - RUA JOAO BORGES nº 204 - GAVEA, RIO DE JANEIRO - RJ
          CEP:22451100
        </p>

        <div className="rodape-final">
          <span>{impressoEm}</span>
          <span>Contatos: (21) 2529-4422</span>
          <span>Pág. 1 de 1</span>
        </div>
      </footer>
    </div>
  );
}

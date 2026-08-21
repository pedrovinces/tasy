import type { ReactNode } from "react";

import "@/print/impressao.css";
import logoRedeDor from "@/assets/timbrado/logo-rede-dor.png.asset.json";
import logoRichet from "@/assets/timbrado/logo-richet.svg.asset.json";
import logoSaoVicente from "@/assets/timbrado/logo-sao-vicente.svg.asset.json";
import qrRedeDor from "@/assets/timbrado/qr-rededor.png.asset.json";
import qrRichet from "@/assets/timbrado/qr-richet.png.asset.json";
import { calcularIdade, formatarData, formatarDataHora } from "@/lib/format";
import type { Paciente } from "@/lib/schemas";

interface FolhaA4Props {
  paciente: Paciente;
  titulo: string;
  dataHora: string;
  children: ReactNode;
}

// Folha A4 com o timbrado oficial. Os rótulos Nome Social, CPF, Prontuário,
// Registro, Matrícula, Convênio/Plano e DtHr Admissão existem apenas aqui,
// sempre com valor vazio, por decisão do projeto.
export function FolhaA4({ paciente, titulo, dataHora, children }: FolhaA4Props) {
  const impressoEm = formatarDataHora(new Date().toISOString());

  return (
    <div className="folha-a4">
      <header className="folha-cabecalho">
        <div className="folha-marca">
          <img src={logoSaoVicente.url} alt="São Vicente — Rede D'Or" />
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
            <span className="id-rotulo">CPF:</span>
            <span className="id-valor vazio">.</span>
            <span className="id-rotulo">Leito:</span>
            <span className="id-valor id-curto">{paciente.leito}</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">DtHr Admissão:</span>
            <span className="id-valor vazio">.</span>
            <span className="id-rotulo">Prontuário:</span>
            <span className="id-valor id-curto vazio">.</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Registro:</span>
            <span className="id-valor vazio">.</span>
            <span className="id-rotulo">Matrícula:</span>
            <span className="id-valor vazio">.</span>
          </div>
          <div className="id-linha">
            <span className="id-rotulo">Convênio/Plano:</span>
            <span className="id-valor vazio">.</span>
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
              <img className="rodape-logo" src={logoRichet.url} alt="Richet" />
              <img className="rodape-qr" src={qrRichet.url} alt="QR code Richet" />
            </div>
            <p className="rodape-site">www.richet.com.br</p>
          </div>
          <div className="rodape-coluna">
            <div className="rodape-coluna-topo">
              <img className="rodape-logo" src={logoRedeDor.url} alt="Rede D'Or" />
              <img className="rodape-qr" src={qrRedeDor.url} alt="QR code Rede D'Or" />
            </div>
            <p className="rodape-site">www.rededor.com.br</p>
          </div>
        </div>

        <p className="rodape-endereco">
          HOSPITAIS INTEGRADOS DA GAVEA S/A - RUA JOAO BORGES nº 204 - GAVEA, RIO DE JANEIRO - RJ
          CEP:22451100
        </p>

        <div className="rodape-final">
          <span>Impresso por ______________</span>
          <span>{impressoEm}</span>
          <span>Contatos: (21) 2529-4422</span>
          <span>Pág. 1 de 1</span>
        </div>
      </footer>
    </div>
  );
}

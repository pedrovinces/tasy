import type { ReactNode } from "react";

import "@/print/impressao.css";
import { calcularIdade, formatarData } from "@/lib/format";
import type { Paciente } from "@/lib/schemas";

interface FolhaA4Props {
  paciente: Paciente;
  titulo: string;
  dataHora: string;
  children: ReactNode;
}

// Folha A4 com timbrado. Os rótulos CPF, Prontuário, Convênio e Data de
// admissão existem apenas aqui, sempre com valor vazio, por decisão do projeto.
export function FolhaA4({ paciente, titulo, dataHora, children }: FolhaA4Props) {
  return (
    <div className="folha-a4">
      <header className="folha-cabecalho">
        <div className="folha-logo">Logo São Vicente</div>
        <div className="folha-logo">Logo Rede D'Or</div>
        <div className="folha-logo">Logo Richet</div>
      </header>

      <section className="folha-identificacao">
        <div className="folha-id-linha">
          <div className="folha-id-campo campo-largo">
            <span className="folha-id-rotulo">Nome</span>
            <span className="folha-id-valor">{paciente.nome_completo}</span>
          </div>
        </div>
        <div className="folha-id-linha">
          <div className="folha-id-campo campo-largo">
            <span className="folha-id-rotulo">Filiação</span>
            <span className="folha-id-valor">{paciente.filiacao}</span>
          </div>
        </div>
        <div className="folha-id-linha">
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Nascimento</span>
            <span className="folha-id-valor">
              {formatarData(paciente.data_nascimento)} ({calcularIdade(paciente.data_nascimento)})
            </span>
          </div>
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Sexo</span>
            <span className="folha-id-valor">{paciente.sexo}</span>
          </div>
        </div>
        <div className="folha-id-linha">
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Leito</span>
            <span className="folha-id-valor">{paciente.leito}</span>
          </div>
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Setor</span>
            <span className="folha-id-valor">{paciente.setor}</span>
          </div>
        </div>
        <div className="folha-id-linha">
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">CPF</span>
            <span className="folha-id-valor vazio">.</span>
          </div>
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Prontuário</span>
            <span className="folha-id-valor vazio">.</span>
          </div>
        </div>
        <div className="folha-id-linha">
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Convênio</span>
            <span className="folha-id-valor vazio">.</span>
          </div>
          <div className="folha-id-campo">
            <span className="folha-id-rotulo">Data de admissão</span>
            <span className="folha-id-valor vazio">.</span>
          </div>
        </div>
      </section>

      <h1 className="folha-titulo">{titulo}</h1>
      <p className="folha-data">{dataHora}</p>

      <div className="folha-corpo">{children}</div>

      <footer className="folha-rodape">
        <div className="folha-linha-assinatura">Assinatura e carimbo</div>
      </footer>
    </div>
  );
}

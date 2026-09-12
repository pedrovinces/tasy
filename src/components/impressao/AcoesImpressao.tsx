import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { registrarEvento, type TipoDocumento } from "@/lib/eventos";
import { obterSetorSelecionado } from "@/lib/setores";

// Barra de ações das quatro folhas de impressão. Some no papel: a classe
// `acoes-impressao` é escondida na mídia de impressão.
//
// Sair da folha descarta o documento — ele não existe em banco nem em arquivo,
// só nesta aba, e não há como recuperá-lo depois. Por isso a saída pede
// confirmação: quem clicou na seta sem ter impresso perde o que escreveu.
interface AcoesImpressaoProps {
  pacienteId: string;
  // Qual das quatro folhas é esta, para a contagem de impressões.
  tipo: TipoDocumento;
  // Nome do documento em português, com artigo — "A evolução", "A receita".
  // Os quatro são femininos e a frase do aviso concorda com isso; um nome
  // masculino aqui exigiria reescrevê-la.
  documento: string;
}

export function AcoesImpressao({ pacienteId, tipo, documento }: AcoesImpressaoProps) {
  const navigate = useNavigate();

  // `afterprint` é o mais perto de "foi impresso" que o navegador oferece: ele
  // dispara quando a caixa de impressão fecha, tendo saído papel ou não. Serve
  // para separar quem preencheu de quem chegou a mandar imprimir, e conta a
  // reimpressão da mesma folha — o que a contagem de documentos gerados não vê.
  //
  // Fica aqui, e não nas quatro rotas, porque este componente é o único ponto
  // comum a todas elas.
  useEffect(() => {
    const registrar = () => registrarEvento(`impressao_${tipo}`, obterSetorSelecionado());
    window.addEventListener("afterprint", registrar);
    return () => window.removeEventListener("afterprint", registrar);
  }, [tipo]);

  return (
    <div className="acoes-impressao mb-4 flex items-center justify-between">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem imprimir?</AlertDialogTitle>
            <AlertDialogDescription>
              {documento} não fica salva em lugar nenhum: o sistema apenas monta a folha para
              impressão. Ao voltar, ela é descartada e será preciso preencher tudo de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar na folha</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                void navigate({ to: "/pacientes/$pacienteId", params: { pacienteId } })
              }
            >
              Sair e descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Imprimir
      </Button>
    </div>
  );
}

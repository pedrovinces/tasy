import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { eVersaoAntiga, podeRecarregar, recarregarNaVersaoNova } from "@/lib/versao-antiga";

export function ErroRota({ error, reset }: { error: Error; reset: () => void }) {
  // Sem isto, toda falha vira a mesma frase e não há como saber a causa a
  // partir da máquina de quem usa. A mensagem exibida vem do nosso código
  // (nunca traz dado de paciente); o rastro completo fica no console.
  console.error("[rota] falha ao carregar", error);

  const versaoAntiga = eVersaoAntiga(error);
  const [recarregando] = useState(() => versaoAntiga && podeRecarregar());

  useEffect(() => {
    if (recarregando) recarregarNaVersaoNova();
  }, [recarregando]);

  if (recarregando) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Atualizando o sistema…</p>
      </div>
    );
  }

  // Recarregou e continua falhando — ou é navegação anônima, onde a marca não
  // grava. Aqui o pedido é explícito, porque o automático já não resolveu.
  if (versaoAntiga) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">O sistema foi atualizado</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta aba está com uma versão antiga. Recarregue a página para continuar — nada do que você
          digitou nesta tela foi enviado ainda.
        </p>
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar</h2>
      <p className="text-sm text-muted-foreground">
        Ocorreu uma falha ao buscar os dados. Tente novamente.
      </p>
      {error.message && (
        <p className="max-w-md break-words text-xs text-muted-foreground/80">{error.message}</p>
      )}
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}

export function NaoEncontrado() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-foreground">Registro não encontrado</h2>
      <p className="text-sm text-muted-foreground">
        O registro solicitado não existe ou foi removido.
      </p>
      <Button asChild variant="outline">
        <Link to="/pacientes">Voltar para a lista de pacientes</Link>
      </Button>
    </div>
  );
}

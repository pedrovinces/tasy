import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function ErroRota({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar</h2>
      <p className="text-sm text-muted-foreground">
        Ocorreu uma falha ao buscar os dados. Tente novamente.
      </p>
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

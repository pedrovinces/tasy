import { createFileRoute, redirect } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ABERTURA, sistemaAindaFechado } from "@/lib/encerramento";
import { formatarDataHora } from "@/lib/format";

// Tela de espera, antes da hora de abertura. Fica fora de `_authenticated`
// porque precisa abrir sem sessão — é justamente quem ainda não pode entrar
// que cai aqui.
export const Route = createFileRoute("/em-breve")({
  // Passada a hora, ninguém fica preso nesta tela: quem tiver o endereço
  // guardado ou a aba aberta é mandado para a entrada normal.
  beforeLoad: () => {
    if (!sistemaAindaFechado()) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Em breve — Contingência CSV" },
      {
        name: "description",
        content: "O sistema de contingência estará disponível a partir de 12/09/2026, às 23h.",
      },
      { property: "og:title", content: "Em breve — Contingência CSV" },
      {
        property: "og:description",
        content: "O sistema de contingência estará disponível a partir de 12/09/2026, às 23h.",
      },
    ],
  }),
  component: EmBreve,
});

function EmBreve() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <img
        src="/timbrado/logo-sao-vicente.png"
        alt="São Vicente — Rede D'Or"
        className="h-20 w-auto max-w-[18rem]"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Em breve</CardTitle>
          <CardDescription>
            Acesso liberado a partir de {formatarDataHora(ABERTURA.toISOString())}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Sistema de contingência para registro e impressão de documentos durante a
            indisponibilidade do prontuário eletrônico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ENCERRAMENTO, EXPURGO } from "@/lib/encerramento";
import { formatarDataHora } from "@/lib/format";

// Tela final do sistema. Fica fora de `_authenticated` de propósito: precisa
// abrir sem sessão, inclusive para quem tentar entrar depois do prazo.
export const Route = createFileRoute("/encerrado")({
  head: () => ({
    meta: [
      { title: "Sistema encerrado — Contingência CSV" },
      { name: "description", content: "O sistema de contingência foi encerrado." },
      { property: "og:title", content: "Sistema encerrado — Contingência CSV" },
      { property: "og:description", content: "O sistema de contingência foi encerrado." },
    ],
  }),
  component: Encerrado,
});

function Encerrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <img
        src="/timbrado/logo-sao-vicente.png"
        alt="São Vicente — Rede D'Or"
        className="h-20 w-auto max-w-[18rem]"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Sistema encerrado</CardTitle>
          <CardDescription>
            A contingência terminou em {formatarDataHora(ENCERRAMENTO.toISOString())}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            O acesso foi encerrado e os pacientes cadastrados foram apagados em{" "}
            {formatarDataHora(EXPURGO.toISOString())}, sem cópia recuperável pelo sistema.
          </p>
          <p>
            Evoluções, prescrições, receitas e solicitações nunca foram armazenadas: valem os
            documentos impressos, assinados e anexados ao prontuário.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

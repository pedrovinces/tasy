import { createFileRoute, redirect } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ABERTURA, sistemaEncerrado } from "@/lib/encerramento";
import { formatarDataHora } from "@/lib/format";

// TEMPORÁRIO — página de espera.
//
// Enquanto o plantão não começa, quem abre o endereço vê "Em breve" em vez da
// tela de senha: o sistema está publicado, mas não é para uso ainda, e não
// convém parecer o contrário para quem chegar por acaso. A equipe entra por
// /login, que continua funcionando normalmente.
//
// Para devolver o comportamento normal no dia do uso, este arquivo volta a ser
// o redirecionamento de antes: sessão ativa vai para /pacientes, sem sessão vai
// para /login. Nada mais precisa mudar.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (sistemaEncerrado()) throw redirect({ to: "/encerrado" });
  },
  head: () => ({
    meta: [
      { title: "Em breve — Contingência CSV" },
      {
        name: "description",
        content: "O sistema de contingência estará disponível a partir de 28/08/2026, às 12h.",
      },
      { property: "og:title", content: "Em breve — Contingência CSV" },
      {
        property: "og:description",
        content: "O sistema de contingência estará disponível a partir de 28/08/2026, às 12h.",
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
            Disponível a partir de {formatarDataHora(ABERTURA.toISOString())}.
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

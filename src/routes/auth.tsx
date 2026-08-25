import { createFileRoute, redirect } from "@tanstack/react-router";

// A tela de senha mudou de /auth para /login. Este desvio existe pelos
// navegadores que guardaram o endereço antigo nos testes: sem ele, o
// autocompletar levaria a equipe a um 404 no meio do plantão.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
});

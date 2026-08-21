import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Conta universal da unidade: o usuário informado na tela é convertido em um
// e-mail sintético interno, exigido pelo provedor de autenticação. Não existe
// cadastro nem troca de senha pela interface.
const DOMINIO_INTERNO = "saovicente.local";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso — Contingência UTI" },
      {
        name: "description",
        content: "Acesso da equipe da UTI ao sistema de contingência de evoluções e receitas.",
      },
      { property: "og:title", content: "Acesso — Contingência UTI" },
      {
        property: "og:description",
        content: "Acesso da equipe da UTI ao sistema de contingência de evoluções e receitas.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/setores", replace: true });
    });
  }, [navigate]);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    const emailInterno = `${usuario.trim().toLowerCase()}@${DOMINIO_INTERNO}`;
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInterno,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    void navigate({ to: "/setores" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <img
        src="/timbrado/logo-sao-vicente.png"
        alt="São Vicente — Rede D'Or"
        className="h-20 w-auto max-w-[18rem]"
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Contingência UTI</CardTitle>
          <CardDescription>
            Registro de evoluções e receitas durante a indisponibilidade do prontuário eletrônico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                type="text"
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

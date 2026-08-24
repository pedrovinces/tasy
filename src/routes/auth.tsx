import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { sistemaEncerrado } from "@/lib/encerramento";

// Conta universal da unidade. Como toda a equipe entra pela mesma conta, a
// tela pede só a senha: o usuário é fixo aqui e vira o e-mail sintético que o
// provedor de autenticação exige. Não existe cadastro nem troca de senha pela
// interface — a senha é trocada no painel do Supabase e vale na hora, sem
// republicar o site. Ela é o único segredo do acesso: este identificador viaja
// no pacote que o navegador baixa.
const USUARIO_ACESSO = "admin";
const DOMINIO_INTERNO = "saovicente.local";
const EMAIL_ACESSO = `${USUARIO_ACESSO}@${DOMINIO_INTERNO}`;

export const Route = createFileRoute("/auth")({
  // Não faz sentido oferecer login que não vai levar a lugar nenhum.
  beforeLoad: () => {
    if (sistemaEncerrado()) throw redirect({ to: "/encerrado" });
  },
  head: () => ({
    meta: [
      { title: "Acesso — Contingência CSV" },
      {
        name: "description",
        content: "Acesso da equipe da UTI ao sistema de contingência de evoluções e receitas.",
      },
      { property: "og:title", content: "Acesso — Contingência CSV" },
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
    const { error } = await supabase.auth.signInWithPassword({
      email: EMAIL_ACESSO,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      toast.error("Senha inválida.");
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
          <CardTitle className="text-xl">Contingência CSV</CardTitle>
          <CardDescription>
            Registro de evoluções e receitas durante a indisponibilidade do prontuário eletrônico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Senha de acesso</Label>
              <Input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
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

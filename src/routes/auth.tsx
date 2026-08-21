import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/pacientes", replace: true });
    });
  }, [navigate]);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    void navigate({ to: "/pacientes" });
  }

  async function criarConta(evento: FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível criar a conta. Verifique os dados.");
      return;
    }
    if (data.session) {
      void navigate({ to: "/pacientes" });
      return;
    }
    toast.success("Conta criada. Confirme o e-mail para entrar.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Contingência UTI</CardTitle>
          <CardDescription>
            Registro de evoluções e receitas durante a indisponibilidade do prontuário eletrônico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={entrar} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-entrar">E-mail</Label>
                  <Input
                    id="email-entrar"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-entrar">Senha</Label>
                  <Input
                    id="senha-entrar"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="criar">
              <form onSubmit={criarConta} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-criar">E-mail</Label>
                  <Input
                    id="email-criar"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-criar">Senha</Label>
                  <Input
                    id="senha-criar"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Criando…" : "Criar conta da unidade"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

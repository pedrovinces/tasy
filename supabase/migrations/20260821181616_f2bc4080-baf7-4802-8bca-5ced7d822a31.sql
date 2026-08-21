CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  filiacao TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  sexo TEXT NOT NULL,
  leito TEXT NOT NULL,
  setor TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe autenticada lê pacientes" ON public.pacientes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Equipe autenticada cadastra pacientes" ON public.pacientes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Equipe autenticada atualiza pacientes" ON public.pacientes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.evolucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.evolucoes TO authenticated;
GRANT ALL ON public.evolucoes TO service_role;
ALTER TABLE public.evolucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe autenticada lê evoluções" ON public.evolucoes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Equipe autenticada registra evoluções" ON public.evolucoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('itens', 'livre')),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  texto_livre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.receitas TO authenticated;
GRANT ALL ON public.receitas TO service_role;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe autenticada lê receitas" ON public.receitas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Equipe autenticada registra receitas" ON public.receitas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.receita_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  medicamento TEXT NOT NULL,
  dose TEXT NOT NULL,
  via TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.receita_itens TO authenticated;
GRANT ALL ON public.receita_itens TO service_role;
ALTER TABLE public.receita_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe autenticada lê itens de receita" ON public.receita_itens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Equipe autenticada registra itens de receita" ON public.receita_itens FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
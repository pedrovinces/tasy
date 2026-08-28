-- A UTI Geral SS deixou de ser setor à parte: é a mesma UTI Geral, com outros
-- leitos. Este comando passa para "UTI Geral" quem já estava cadastrado com o
-- nome antigo.
--
-- Como usar: painel do Supabase → SQL Editor → colar → Run.
--
-- Não é urgente: o sistema já traduz o nome antigo ao ler (normalizarSetor, em
-- src/lib/setores.ts), então ninguém some da tela enquanto isso. O que este
-- comando faz é arrumar o que está gravado, de uma vez.

update public.pacientes
   set setor = 'UTI Geral',
       updated_at = now()
 where setor = 'UTI Geral SS';

-- Conferência: não deve sobrar nenhuma linha.
-- select count(*) from public.pacientes where setor = 'UTI Geral SS';

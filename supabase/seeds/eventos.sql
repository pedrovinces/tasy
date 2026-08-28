-- Contagem de uso do sistema: acessos e documentos gerados.
--
-- Como usar: painel do Supabase → SQL Editor → colar → Run. Enquanto esta
-- tabela não existir, o /dashboard mostra as estatísticas do banco normalmente
-- e avisa que a contagem de uso ainda não está ligada.
--
-- NÃO guarda dado de paciente, e não tem como guardar: as únicas colunas são o
-- tipo do evento, o setor de quem estava usando e a hora. Nem identificador de
-- paciente, nem texto do documento — o documento continua existindo só no
-- navegador, até a impressão.

create table if not exists public.eventos (
  id uuid not null default gen_random_uuid() primary key,
  -- 'acesso' ou o tipo do documento: evolucao, prescricao, receita, solicitacao
  tipo text not null,
  setor text,
  criado_em timestamptz not null default now()
);

create index if not exists eventos_criado_em on public.eventos (criado_em);

grant select, insert on public.eventos to authenticated;
grant all on public.eventos to service_role;

alter table public.eventos enable row level security;

drop policy if exists "Equipe autenticada lê eventos" on public.eventos;
create policy "Equipe autenticada lê eventos" on public.eventos
  for select to authenticated using (auth.uid() is not null);

drop policy if exists "Equipe autenticada registra eventos" on public.eventos;
create policy "Equipe autenticada registra eventos" on public.eventos
  for insert to authenticated with check (auth.uid() is not null);

-- Conferência:
-- select tipo, count(*) from public.eventos group by tipo order by 2 desc;

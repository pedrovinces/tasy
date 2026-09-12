-- ---------------------------------------------------------------------------
-- Reabertura do banco — para rodar AGORA
--
-- Cole no SQL Editor do Supabase e execute uma vez.
--
-- Roda inteiro em qualquer estado do banco: com ou sem as tarefas de
-- encerramento agendadas, com ou sem a tabela de eventos criada. Nada aqui dá
-- erro por já estar do jeito certo — o editor do Supabase roda o script numa
-- transação só, e um único erro no meio desfaz tudo o que veio antes.
--
-- A espera até as 23h de 12/09 fica só na tela do sistema, por opção: o banco
-- volta a responder a partir de agora. Vale saber o que isso significa — a
-- verificação de horário roda no computador de quem acessa, então quem atrasar
-- o relógio, ou chamar a API direto com a senha da equipe, entra antes da
-- hora. O horário organiza a equipe; não é uma tranca.
-- ---------------------------------------------------------------------------

-- 1. Devolve o acesso da aplicação ------------------------------------------
-- Se nunca foi revogado, isto não muda nada e não dá erro.
grant select, insert, update on public.pacientes to authenticated;

-- A tabela de eventos pode ainda não existir; sem ela não há o que liberar.
do $$
begin
  if to_regclass('public.eventos') is null then
    raise notice 'Tabela public.eventos não existe — rode supabase/seeds/eventos.sql para ligar a contagem de uso.';
  else
    execute 'grant select, insert on public.eventos to authenticated';
  end if;
end $$;

-- 2. Desarma o que tiver sobrado do encerramento de agosto -------------------
-- A expressão de agendamento não tem campo de ano: uma tarefa esquecida aqui
-- revogaria o acesso e apagaria a tabela todo 29 de agosto. Desagendar pelo
-- nome direto falha quando a tarefa não existe, e o erro derrubaria o script
-- inteiro — por isso a varredura.
do $$
declare
  tarefa text;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron não instalado — nenhuma tarefa agendada para desarmar.';
    return;
  end if;
  for tarefa in select jobname from cron.job where jobname like 'contingencia-%' loop
    perform cron.unschedule(tarefa);
    raise notice 'Tarefa desarmada: %', tarefa;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Conferência (rode depois, uma consulta de cada vez)
-- ---------------------------------------------------------------------------
-- Os pacientes de agosto ainda estão aí?
--   select count(*) from public.pacientes;
--
-- Devem aparecer SELECT, INSERT e UPDATE:
--   select privilege_type from information_schema.role_table_grants
--    where table_name = 'pacientes' and grantee = 'authenticated';
--
-- Não deve sobrar tarefa da contingência:
--   select jobname, schedule, active from cron.job;

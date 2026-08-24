-- ---------------------------------------------------------------------------
-- Encerramento da contingência
--
-- Cole este arquivo inteiro no SQL Editor do Supabase (Lovable → Cloud → abrir
-- o Supabase → SQL Editor) e execute uma vez. Ele agenda duas tarefas:
--
--   29/08/2026 00h30 (Brasília) → revoga o acesso da aplicação aos pacientes
--   29/08/2026 02h30 (Brasília) → apaga todos os pacientes
--
-- IMPORTANTE: o agendador roda em UTC, e Brasília é UTC-3. Por isso os
-- horários abaixo são 03:30 e 05:30 — não 00:30 e 02:30.
--
-- Por que no banco e não no aplicativo: o site é estático, sem servidor. O
-- código dele só bloqueia a tela, e roda no computador de quem acessa — mudar
-- o relógio da máquina contorna o bloqueio. Além disso a aplicação não tem
-- permissão de DELETE, de propósito. Quem encerra de verdade é isto aqui.
-- ---------------------------------------------------------------------------

-- 1. Agendador -------------------------------------------------------------
create extension if not exists pg_cron;

-- 2. Encerramento do acesso — 29/08/2026 03:30 UTC ---------------------------
-- Sem estas permissões, nem o site nem qualquer chamada direta à API com a
-- senha da equipe conseguem ler ou gravar pacientes.
select cron.schedule(
  'contingencia-encerrar-acesso',
  '30 3 29 8 *',
  $$revoke select, insert, update on public.pacientes from authenticated$$
);

-- 3. Expurgo dos pacientes — 29/08/2026 05:30 UTC ----------------------------
-- DELETE físico, não a exclusão lógica que a interface faz (ativo = false).
-- Depois disto a linha deixa de existir: nem o sistema nem a API a devolvem.
select cron.schedule(
  'contingencia-expurgar-pacientes',
  '30 5 29 8 *',
  $$delete from public.pacientes$$
);

-- ---------------------------------------------------------------------------
-- Conferência (rode agora, depois de agendar)
-- ---------------------------------------------------------------------------
-- Devem aparecer as duas tarefas, com active = true:
--
--   select jobid, jobname, schedule, command, active from cron.job;
--
-- Depois do expurgo, isto deve devolver 0:
--
--   select count(*) from public.pacientes;
--
-- E o histórico de execução mostra se rodaram sem erro:
--
--   select jobid, status, return_message, start_time
--     from cron.job_run_details order by start_time desc limit 10;

-- ---------------------------------------------------------------------------
-- Se a data mudar, ou for preciso reabrir
-- ---------------------------------------------------------------------------
--   select cron.unschedule('contingencia-encerrar-acesso');
--   select cron.unschedule('contingencia-expurgar-pacientes');
--   grant select, insert, update on public.pacientes to authenticated;
--
-- Reabrir também exige trocar a data em src/lib/encerramento.ts e publicar,
-- senão a tela continua bloqueando.

-- ---------------------------------------------------------------------------
-- Duas ressalvas honestas
-- ---------------------------------------------------------------------------
-- 1. A expressão de agendamento não tem campo de ano: ela dispara todo 29 de
--    agosto. Nos anos seguintes não haverá nada a revogar nem a apagar, mas se
--    o projeto for reaproveitado, remova as tarefas com unschedule.
--
-- 2. O delete tira as linhas da tabela, e é isso que "não recuperável"
--    significa aqui. Os backups automáticos do Supabase, porém, podem conter
--    uma cópia dentro da janela de retenção do plano, e isso não se apaga por
--    SQL. Se a exigência for não restar registro em lugar nenhum, o passo
--    definitivo é excluir o projeto do Supabase depois do expurgo.

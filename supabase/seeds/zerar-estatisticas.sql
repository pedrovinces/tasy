-- Zera o painel: apaga tudo o que já foi contado de uso — entradas com senha,
-- documentos gerados, impressões e movimento de paciente.
--
-- Como usar: painel do Supabase → SQL Editor → colar o CONTEÚDO deste arquivo
-- (não o caminho dele) → Run.
--
-- O que NÃO é apagado: a lista de pacientes. Os números de paciente que o
-- painel mostra vêm da tabela `pacientes`, e ali paciente nunca é apagado de
-- verdade — saída é `ativo = false`. Zerar estatística é outra coisa.
--
-- Roda mesmo se a tabela ainda não existir: nesse caso não havia estatística
-- para zerar, e o aviso diz isso em vez de derrubar o script inteiro.

do $$
declare
  apagados integer;
begin
  if to_regclass('public.eventos') is null then
    raise notice 'A tabela public.eventos não existe — não havia estatística para zerar.';
    return;
  end if;

  delete from public.eventos;
  get diagnostics apagados = row_count;
  raise notice 'Estatísticas zeradas: % registro(s) apagado(s).', apagados;
end $$;

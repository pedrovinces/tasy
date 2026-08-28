-- Um paciente de teste por setor, para conferir a listagem, a busca e a
-- impressão de cada unidade antes do plantão. São nove linhas para oito
-- setores: os dois da UTI Geral cobrem os leitos comuns e os do SS, que
-- deixou de ser setor à parte.
--
-- Como usar: painel do Supabase → SQL Editor → colar → Run.
--
-- IMPORTANTE: apagar antes das 12h de 28/08/2026, senão a equipe encontra
-- paciente inventado na lista. O comando de limpeza está no fim do arquivo.
--
-- O valor de `setor` precisa bater letra por letra com a lista de
-- src/lib/setores.ts — é por igualdade exata que a listagem filtra.
-- A identificação vai em caixa alta, como o sistema grava.

insert into public.pacientes
  (nome_completo, filiacao, data_nascimento, sexo, leito, setor, ativo)
values
  ('TESTE EMERGÊNCIA',    'TESTE FILIAÇÃO', '1950-01-15', 'Feminino',  'EMERG 01',  'Emergência',   true),
  ('TESTE UI I',          'TESTE FILIAÇÃO', '1955-03-20', 'Masculino', 'UI I 01',   'UI I',         true),
  ('TESTE UI II',         'TESTE FILIAÇÃO', '1960-06-05', 'Feminino',  'UI II 01',  'UI II',        true),
  ('TESTE UI III',        'TESTE FILIAÇÃO', '1948-09-11', 'Masculino', 'UI III 01', 'UI III',       true),
  ('TESTE TMO',           'TESTE FILIAÇÃO', '1972-02-28', 'Feminino',  'TMO 01',    'TMO',          true),
  ('TESTE USI',           'TESTE FILIAÇÃO', '1965-11-30', 'Masculino', 'USI 01',    'USI',          true),
  ('TESTE UTI GERAL',     'TESTE FILIAÇÃO', '1943-07-08', 'Feminino',  'UTI 01',    'UTI Geral',    true),
  ('TESTE UTI GERAL SS',  'TESTE FILIAÇÃO', '1958-04-22', 'Masculino', 'UTI SS 01', 'UTI Geral',    true),
  ('TESTE UCI',           'TESTE FILIAÇÃO', '1980-12-03', 'Feminino',  'UCI 01',    'UCI',          true);

-- Conferência: nove linhas, uma por setor.
-- select setor, nome_completo, leito from public.pacientes
--   where nome_completo like 'TESTE %' order by setor;

-- Limpeza (rodar antes do plantão):
-- delete from public.pacientes where nome_completo like 'TESTE %';

# Plano — Sistema de Contingência da UTI (evoluções e receitas impressas)

## Objetivo

Aplicação web para a equipe da UTI registrar **evoluções clínicas** e **receitas** durante a
indisponibilidade do prontuário eletrônico, com **impressão em folha A4 com timbrado desenhado
pela aplicação** (logos São Vicente, Rede Dor e Richet), para assinatura e carimbo manuais.
Não é prontuário eletrônico: sem assinatura eletrônica e sem texto de validade jurídica em tela.

## Decisões já confirmadas

- **Acesso:** conta única da unidade, com e-mail e senha (Lovable Cloud).
- **Timbrado:** desenhado na impressão; logos e folha de exemplo serão enviados pelo usuário
  (até lá, cabeçalho com espaços reservados para as três logos).
- **Documentos:** evolução clínica (texto livre) e receita em dois formatos — lista de itens
  (medicamento, dose, via, frequência) ou texto livre.
- **Identificação no impresso:** apenas linha em branco para assinatura e carimbo.

## Regras permanentes (valem para todo o projeto)

1. Nunca assinatura eletrônica nem texto afirmando validade jurídica do documento em tela.
2. Nunca nome de paciente em URL, parâmetro de rota, nome de arquivo ou console.log. Nenhum dado
   de paciente sai para serviço externo. Sem analytics, telemetria ou script de terceiro.
3. Identificadores do paciente apenas: nome completo, filiação, data de nascimento, sexo, leito,
   setor. Rótulos CPF, prontuário, convênio e data de admissão existem **só no impresso**, sempre
   com valor vazio — nunca como campos no sistema.
4. Toda tabela nasce com RLS ativa, GRANTs explícitos e políticas explícitas; nada público.
5. Exclusão de paciente é lógica (`ativo = false`). Nenhum DELETE físico de paciente ou documento.
6. Idade nunca é armazenada — calculada na hora a partir da data de nascimento.
7. Folha de impressão em arquivo CSS próprio, medidas em mm, sem classes utilitárias, A4.
8. Interface em português do Brasil; datas dd/mm/aaaa; horas 24h.
9. Sem bibliotecas novas sem necessidade real.
10. Mudanças pedidas em uma tela alteram apenas aquela tela.

## Estrutura a construir

### 1. Backend (Lovable Cloud)

Habilitar o Lovable Cloud e criar a migração com:

- **`pacientes`**: id (uuid), nome_completo, filiacao, data_nascimento (date), sexo, leito,
  setor, ativo (bool, default true), created_at, updated_at.
- **`evolucoes`**: id, paciente_id (FK), data_hora (timestamptz), texto, created_at.
- **`receitas`**: id, paciente_id (FK), tipo ('itens' | 'livre'), data_hora, texto_livre
  (nullable), created_at.
- **`receita_itens`**: id, receita_id (FK), medicamento, dose, via, frequencia, ordem.

Segurança na migração: GRANTs para `authenticated` e `service_role`, RLS ativa em todas as
tabelas, políticas de SELECT/INSERT/UPDATE apenas para usuários autenticados, **sem GRANT de
DELETE** e sem política de DELETE. Nenhum acesso `anon`.

Server functions com `requireSupabaseAuth` para listar/criar pacientes, registrar evoluções e
receitas, e buscar documento para impressão (por UUID — nunca por nome).

### 2. Telas (interface Tailwind + shadcn/ui, pt-BR)

- **`/auth`** — login com e-mail e senha da conta única da unidade.
- **`/` (protegida)** — lista de pacientes ativos com busca por nome/leito, botão "Novo paciente"
  e ação de exclusão lógica (marcar inativo, com confirmação).
- **`/pacientes/$id`** — ficha do paciente (dados, idade calculada) com histórico de evoluções e
  receitas, e botões "Nova evolução" e "Nova receita".
- **`/pacientes/$id/evolucao/nova`** — formulário: data/hora (padrão = agora) e texto livre.
- **`/pacientes/$id/receita/nova`** — escolha do formato: lista de itens (linhas medicamento,
  dose, via, frequência, adicionar/remover) ou texto livre.
- **`/imprimir/evolucao/$id`** e **`/imprimir/receita/$id`** — folha A4 para impressão.

Validação com zod em todos os formulários (campos obrigatórios, limites de tamanho).

### 3. Folha de impressão (arquivo CSS próprio, ex.: `src/print/impressao.css`)

- `@page` A4, medidas em milímetros, fonte serifada sóbria, zero classes utilitárias.
- Cabeçalho com as três logos (São Vicente, Rede Dor, Richet) — placeholders até o envio das
  imagens e da folha de exemplo, quando o layout será ajustado para ficar idêntico.
- Bloco de identificação: nome, filiação, nascimento + idade calculada, sexo, leito, setor, e os
  rótulos CPF / Prontuário / Convênio / Data de admissão **sempre vazios**.
- Título do documento (EVOLUÇÃO / RECEITA), data/hora, corpo do documento.
- Rodapé com linha para assinatura e carimbo, sem nome pré-impresso.
- Botão "Imprimir" (window.print); na mídia `print` some toda a interface e fica só a folha.

## Ordem de execução

1. Habilitar Lovable Cloud + migração (tabelas, GRANTs, RLS).
2. Autenticação (login `/auth`, layout `_authenticated`, middleware de bearer token).
3. Lista de pacientes + cadastro + exclusão lógica.
4. Ficha do paciente + registro de evolução e receita.
5. Folha de impressão + rotas de impressão (com placeholders de logo).
6. Revisão final: metadados de head por rota, pt-BR, formatos de data/hora.

## Fora de escopo (não será feito)

- Assinatura eletrônica, validade jurídica em tela, exportação de PDF com nome de paciente,
  analytics/telemetria, campos de CPF/prontuário/convênio/data de admissão no sistema.

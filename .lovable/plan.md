# Timbrado oficial, fonte Arial e impressão direta após registrar

## Objetivo

Reproduzir no impresso o cabeçalho e rodapé da folha oficial enviada (foto de exemplo), trocar a fonte do documento para Arial e fazer o registro de evolução/receita levar direto à folha de impressão com a caixa de diálogo de impressão abrindo automaticamente.

## 1. Imagens do timbrado

- **Logo São Vicente**: usar o SVG enviado (`Logo-Sao-Vicente-2024.svg`) no canto superior esquerdo, como no exemplo.
- **Logo Richet**: usar o SVG enviado (`richet_logo.svg`) no rodapé.
- **Logo Rede D'Or**: recortar as bordas brancas do webp enviado (a arte ocupa só a faixa central) e usar no rodapé.
- **QR codes**: gerar imagens nítidas a partir dos destinos decodificados da foto de exemplo — Richet: `https://richet.com.br/` · Rede D'Or: `https://www.rededorsaoluiz.com.br/acesse-rapido?utm_source=impressa&utm_medium=qr-code`. Gerados uma vez, como arquivos estáticos (sem biblioteca nova no app e sem serviço externo).
- Todas as imagens sobem como assets CDN e são referenciadas no componente de impressão.
- **Código de barras do exemplo não será reproduzido**: ele carrega o número de Registro, que por regra do projeto fica sempre vazio.

## 2. Folha A4 fiel ao exemplo (`FolhaA4.tsx` + `impressao.css`)

**Cabeçalho**
- À esquerda: logo São Vicente.
- À direita: quadro de identificação com borda, na mesma ordem do exemplo:
  - Registro Civil: nome completo do paciente
  - Nome Social: *(vazio)*
  - Dt Nascimento + **Idade calculada na hora** + Sexo
  - Filiação
  - CPF *(vazio)* · Leito
  - DtHr Admissão *(vazio)* · Prontuário *(vazio)*
  - Registro *(vazio)* · Matrícula *(vazio)*
  - Convênio/Plano *(vazio)*
  - Setor
- Barra preta com o título do documento em branco e maiúsculo: **RECEITA** ou **EVOLUÇÃO** (como no exemplo).

**Corpo**
- Fonte **Arial** em todo o documento (trocar Georgia por Arial no `impressao.css`).
- Evolução: texto do registro. Receita: tabela de itens ou texto livre (inalterado).

**Assinatura**
- Apenas a linha "ASSINATURA E CARIMBO" em branco (decisão anterior mantida; sem linha "Aferido por").

**Rodapé (fixo ao final da folha)**
- Frase: "Rede D'Or: a maior rede de saúde da América Latina" e "Agende consultas, exames e vacinas de forma prática e rápida".
- Duas colunas: logo Richet + QR + `www.richet.com.br` · logo Rede D'Or + QR + `www.rededor.com.br`.
- Endereço: HOSPITAIS INTEGRADOS DA GAVEA S/A - RUA JOAO BORGES nº 204 - GAVEA, RIO DE JANEIRO - RJ CEP:22451100.
- Linha final: "Impresso por \_\_\_\_\_" (em branco, para preencher à caneta) · data/hora da impressão · "Pág. 1 de 1" · Contatos: (21) 2529-4422.

## 3. Ir direto para a impressão ao registrar

- Ao salvar evolução ou receita, navegar direto para a folha de impressão daquele documento (em vez de voltar à ficha do paciente).
- A folha de impressão abre a caixa de diálogo de impressão automaticamente assim que os dados e as imagens carregam (`window.print()`), mantendo o botão "Imprimir" visível para reimprimir.
- Ajustar a mensagem de confirmação para refletir o novo fluxo.

## Arquivos alterados

- `src/components/impressao/FolhaA4.tsx` — novo layout de cabeçalho, quadro de identificação, barra de título e rodapé institucional.
- `src/print/impressao.css` — fonte Arial, estilos do quadro, da barra de título e do rodapé em milímetros.
- `src/routes/_authenticated/pacientes/$pacienteId/evolucao/nova.tsx` e `receita/nova.tsx` — navegar para a impressão após salvar.
- `src/routes/_authenticated/imprimir/evolucao/$evolucaoId.tsx` e `receita/$receitaId.tsx` — disparo automático da impressão.
- Novos assets em `src/assets/` (logos e QR codes).

## Verificação

- Registrar evolução e receita de teste e confirmar o redirecionamento direto para a folha com a impressão abrindo.
- Conferir visualmente a folha contra a foto de exemplo (cabeçalho, quadro de identificação, barra de título, rodapé com logos e QR codes).
- Confirmar campos proibidos sempre vazios e idade calculada.

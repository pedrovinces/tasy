# Sistema de contingência — São Vicente

Registro e impressão de documentos clínicos enquanto o Tasy está indisponível.
React 19 + Vite + TanStack Router/Query + Tailwind, dados no Supabase, site
estático publicado no Cloudflare Pages.

## Publicar é parte da tarefa

**O Cloudflare Pages publica a branch `main`. Trabalho parado numa branch não
está no ar, e portanto não está feito.**

Toda mudança pedida termina em produção, sem etapa pendente:

1. commit na branch de trabalho;
2. `git push -u origin <branch>`;
3. abrir o PR para `main` e mesclar;
4. confirmar que a `main` recebeu o commit
   (`git fetch origin main && git log --oneline origin/main -1`).

Só depois disso a mudança pode ser relatada como pronta. Se algum passo não
puder ser feito — falta de acesso, conflito, CI vermelha — isso é dito
explicitamente, com o que ficou faltando; nunca se descreve como concluído o
que ficou na branch. Vale também para correções pequenas: já aconteceu de uma
correção de tela em branco ficar semanas na branch enquanto o site seguia com o
defeito.

Exceção única: quando a pessoa pedir, na mesma conversa, para não publicar
ainda.

## Contexto de uso

- Janela de uso: 28/08/2026 12h → 29/08/2026 00h (`src/lib/encerramento.ts`).
- Sete domínios servem o mesmo site; cada um abre no seu setor
  (`src/lib/dominios.ts`). Hospedagem e domínios em `docs/hospedagem.md`.
- Usuários são médicos em plantão, muitos no celular. Erro na tela custa caro:
  mudança que afete login, listagem ou impressão é testada no navegador antes
  de publicar, não só com `tsc` e `build`.

## Regras que não se quebram

- **Nunca** registrar dado de paciente em log, comentário, commit ou mensagem
  de erro. Os logs de erro levam o erro do Supabase, nunca a linha.
- **Nunca** apagar paciente de verdade: exclusão é lógica (`ativo = false`).
- Nunca pedir nem usar senha ou token de serviço de terceiros (GitHub,
  Cloudflare, Locaweb, Supabase) da pessoa.

## Convenções

- Código e comentários em português, como o resto do repositório. Comentário
  explica _por quê_, não o quê.
- Antes de publicar: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`,
  `npm run build`.
- Identificação do paciente (nome, filiação, leito) é sempre caixa alta; busca
  ignora acento. Ambos em `src/lib/texto.ts` — reutilizar, não recriar.
- Impressão vive em `src/print/impressao.css` e `src/components/impressao/`,
  em milímetros e sem classes utilitárias, para não deformar o timbrado.

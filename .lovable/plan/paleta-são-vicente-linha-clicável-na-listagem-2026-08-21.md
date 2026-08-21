# Paleta São Vicente + linha clicável na listagem

## 1. Paleta de cores baseada na logo São Vicente

A logo usa tons de dourado/envelhecido (`#cda176` e `#c19f77`). Hoje o sistema usa um azul-petróleo genérico. Vou trocar os tokens do tema claro em `src/styles.css` por uma paleta quente derivada da logo:

- **Primária** (botões, links de ação): bronze escuro derivado do dourado da logo (aprox. `#6b543a`), para manter contraste com texto branco.
- **Destaques e foco (ring)**: dourado da logo `#cda176`.
- **Fundo**: branco quente levemente arenoso (aprox. `#faf7f2`), no lugar do branco azulado atual.
- **Texto**: marrom-acinzentado escuro quente.
- **Secundária/muted/bordas**: areia claro (aprox. `#f3ede3`), com texto secundário em tom quente.
- **Vermelho destrutivo** (remover paciente, erros): mantido.

Os valores serão escritos em `oklch` (padrão do projeto). O tema escuro (`.dark`) não é usado pela aplicação e fica como está. A folha de impressão (`src/print/impressao.css`) **não muda** — o timbrado impresso já é preto/branco e segue a foto oficial.

## 2. Linha clicável na listagem de pacientes

Em `src/routes/_authenticated/pacientes/index.tsx`:

- Remover o botão **Abrir**.
- A linha inteira da tabela passa a abrir a ficha do paciente ao clique (`cursor-pointer` + realce no hover).
- O botão de lixeira continua na linha, mas com `stopPropagation` para abrir apenas a confirmação de remoção, sem navegar.
- Navegação via `useNavigate` do TanStack Router (por id, sem dados de paciente na URL).

## Verificação

- Conferir build e, via Playwright, validar: novo visual da lista e do login, clique na linha abrindo a ficha, e lixeira funcionando sem disparar navegação.

## Detalhes técnicos

- Arquivos alterados: `src/styles.css` (somente bloco `:root`) e `src/routes/_authenticated/pacientes/index.tsx`.
- Nenhuma mudança de banco, rotas ou impressão.

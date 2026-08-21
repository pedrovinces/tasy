# Ajustes no impresso: título, rodapé proporcional e rodapé após o texto

## O que muda

1. **Título da folha de evolução**
   - Na rota `src/routes/_authenticated/imprimir/evolucao/$evolucaoId.tsx`, trocar `titulo="Evolução Clínica"` por `titulo="Evolução Multiprofissional"` — a barra preta do impresso passa a exibir "EVOLUÇÃO MULTIPROFISSIONAL" (o componente já aplica caixa alta).
   - Somente o impresso muda; telas de registro e histórico continuam dizendo "evolução".

2. **Logo e QR code do rodapé com o mesmo tamanho**
   - Em `src/print/impressao.css`, igualar as alturas: `.rodape-logo` passa a ter altura fixa igual à do QR (15mm), com largura automática para não distorcer; `.rodape-qr` permanece 15mm × 15mm.
   - Resultado: logo Richet, QR Richet, logo Rede D'Or e QR Rede D'Or todos com a mesma altura visual, lado a lado como na foto.

3. **Rodapé logo após o texto da evolução**
   - Hoje `.folha-corpo` tem `flex: 1 0 auto` e `.folha-rodape` tem `margin-top: auto`, o que empurra o rodapé sempre para o fim da folha A4.
   - Remover esses dois posicionamentos fixos e dar um espaçamento constante (ex.: margem superior de ~6mm no bloco de assinatura/rodapé), de modo que assinatura e rodapé subam e desçam conforme o tamanho do texto digitado.
   - Em evoluções longas que ultrapassam uma página, o rodapé segue naturalmente após o fim do texto.

## Verificação

- Conferir o build (`build-errors.log`).
- Teste no navegador (Playwright, sessão admin): imprimir uma evolução curta e uma longa, capturar telas e confirmar que (a) o título saiu como EVOLUÇÃO MULTIPROFISSIONAL, (b) logos e QR codes têm a mesma altura e (c) o rodapé aparece logo após o texto em ambos os casos.

## Detalhes técnicos

- Arquivos tocados: `src/routes/_authenticated/imprimir/evolucao/$evolucaoId.tsx` (1 linha) e `src/print/impressao.css` (regras `.rodape-logo`, `.rodape-qr`, `.folha-corpo`, `.folha-rodape`, `.folha-linha-assinatura`).
- A folha de receita (`imprimir/receita/$receitaId.tsx`) herda automaticamente os ajustes 2 e 3, pois usa o mesmo `FolhaA4` e `impressao.css`; seu título "RECEITA" não muda.
- Nenhuma mudança em banco de dados, rotas ou telas de registro.

# ICU Support System

CONTEXTO DO PROJETO

Aplicação de contingência para uma unidade de terapia intensiva. O prontuário eletrônico do

hospital ficará indisponível durante uma troca de sistemas. A equipe usará esta aplicação para

registrar evoluções e receitas no computador, imprimir em papel timbrado idêntico ao do hospital,

assinar e carimbar. Os impressos são anexados ao prontuário oficial depois.

REGRAS QUE VALEM SEMPRE

1. Isto não é prontuário eletrônico. Nunca implemente assinatura eletrônica, nunca gere texto

   afirmando validade jurídica do documento em tela. O documento vale após impressão, assinatura

   e carimbo manuais.

2. Dados de paciente são dados pessoais sensíveis. Nunca escreva nome de paciente em URL, em

   parâmetro de rota, em nome de arquivo exportado ou em console.log. Nunca envie dado de paciente

   para qualquer serviço externo. Sem analytics, sem telemetria, sem script de terceiro.

3. Colete apenas estes campos identificadores: nome completo, filiação, data de nascimento, sexo,

   leito e setor. Nunca crie campo de CPF, prontuário, matrícula de convênio, convênio ou data de

   admissão. Esses rótulos existem só no papel impresso, sempre com valor vazio.

4. Toda tabela do Supabase nasce com Row Level Security ativa e política explícita. Nunca deixe

   tabela pública nem política com `using (true)` para leitura de dados de paciente.

5. Exclusão de paciente é lógica, marcando `ativo = false`. Nunca faça DELETE físico de paciente

   ou de documento por ação da interface.

6. Idade nunca é armazenada. É sempre calculada na hora, a partir da data de nascimento.

7. A interface usa Tailwind e shadcn/ui. A folha de impressão é a exceção: fica em um arquivo CSS

   próprio, com medidas em milímetros e sem classes utilitárias, para não deformar o timbre em A4.

8. Idioma da interface: português do Brasil. Datas em dd/mm/aaaa. Horas em formato 24h.

9. Não instale biblioteca nova sem necessidade real. Não troque de biblioteca de rotas, de estado

   ou de formulário depois que algo estiver funcionando.

10. Quando eu pedir uma mudança em uma tela, altere apenas aquela tela. Não refatore o resto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tasy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9deaf0cb-e224-4fc4-89e1-7ba3b20f7cf2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Publicação no GitHub Pages (domínio próprio)

O app é 100% estático: o build gera `dist/` (HTML, CSS e JS) e todo o acesso a dados é feito
pelo navegador direto no Supabase, com o token do usuário logado e as políticas de RLS do banco
como única autorização. Não existe servidor da aplicação — por isso ele cabe no GitHub Pages.

O workflow `.github/workflows/deploy-pages.yml` publica a cada push em `main`.

### 1. Ligar o Pages

Em **Settings → Pages → Build and deployment**, escolha **Source: GitHub Actions**.

O Pages não funciona em repositório privado no plano Free: é preciso deixar o repositório público
ou assinar o GitHub Pro. Em qualquer um dos casos o site publicado é público — o que protege os
dados continua sendo o login e o RLS.

### 2. Apontar o domínio

O domínio `contingenciacsv.com.br` já está fixado em `public/CNAME`, que o build
copia para `dist/`. (A variável `CUSTOM_DOMAIN`, se existir em Settings → Secrets
and variables → Actions → Variables, sobrescreve esse valor.)

Por ser domínio raiz, o apontamento é por registros `A` e `AAAA` — apex não
aceita `CNAME`. No painel da Locaweb, na zona de DNS:

| Tipo    | Nome / Host | Valor                    |
| ------- | ----------- | ------------------------ |
| `A`     | `@` (raiz)  | `185.199.108.153`        |
| `A`     | `@`         | `185.199.109.153`        |
| `A`     | `@`         | `185.199.110.153`        |
| `A`     | `@`         | `185.199.111.153`        |
| `AAAA`  | `@`         | `2606:50c0:8000::153`    |
| `AAAA`  | `@`         | `2606:50c0:8001::153`    |
| `AAAA`  | `@`         | `2606:50c0:8002::153`    |
| `AAAA`  | `@`         | `2606:50c0:8003::153`    |
| `CNAME` | `www`       | `pedrovinces.github.io.` |

Os quatro `A` são do GitHub Pages e convivem: o navegador tenta o próximo se um
falhar. O `CNAME` de `www` faz o GitHub redirecionar automaticamente para a raiz.

Depois, em **Settings → Pages → Custom domain**, trocar para
`contingenciacsv.com.br`, aguardar a verificação e marcar **Enforce HTTPS**.

### 3. Liberar o domínio no Supabase

Nada a fazer para o login funcionar: a tela usa `signInWithPassword`, uma chamada direta à API
do Supabase, sem redirecionamento. **Site URL** e **Redirect URLs** só valem para login social,
link mágico e recuperação de senha por e-mail — nenhum deles existe aqui.

### Detalhes que o Pages exige

- **Rotas internas**: o Pages não reescreve URLs, então o workflow copia `index.html` para
  `404.html`. É isso que faz `/pacientes` funcionar ao abrir direto ou recarregar.
- **`.nojekyll`**: evita que o Jekyll descarte arquivos iniciados por `_`.
- **Variáveis de ambiente**: as `VITE_SUPABASE_*` do `.env` são embutidas no bundle durante o
  build. A chave _publishable_ é pública por definição — quem protege os dados é o RLS.

### Antes de expor em um domínio público

O site fica acessível a qualquer pessoa na internet (a tela de acesso, não os dados). As políticas
de RLS liberam leitura e escrita para **qualquer usuário autenticado**, então vale conferir no
Supabase, em **Authentication → Providers**, se o autocadastro (`Enable email signup`) está
**desligado** — caso contrário alguém poderia criar a própria conta e alcançar os dados dos
pacientes. As contas devem ser criadas apenas pelo painel do Supabase.

## Encerramento programado

A contingência tem prazo. O encerramento acontece em duas camadas, porque uma
sozinha não basta:

| Quando           | O quê                              | Onde                        |
| ---------------- | ---------------------------------- | --------------------------- |
| 29/08/2026 00h30 | Tela deixa de abrir                | `src/lib/encerramento.ts`   |
| 29/08/2026 00h30 | Banco revoga o acesso da aplicação | `supabase/encerramento.sql` |
| 29/08/2026 02h30 | Pacientes apagados                 | `supabase/encerramento.sql` |

**A tela** é bloqueio de cortesia: o site é estático e a verificação usa o
relógio do computador de quem acessa, então atrasar o relógio a contorna. Nas
duas horas anteriores ao prazo, uma faixa avisa quanto tempo resta, para
ninguém ficar escrevendo um documento que não vai conseguir imprimir.

**O banco** é o que encerra de fato. Rode `supabase/encerramento.sql` no SQL
Editor do Supabase (Lovable → Cloud → abrir o Supabase) **antes do prazo**; ele
agenda as duas tarefas com `pg_cron`. Os horários lá estão em UTC, que é o fuso
do agendador: 03:30 e 05:30.

Para mudar a data, altere `ENCERRAMENTO` em `src/lib/encerramento.ts`, publique,
e reagende as tarefas (o próprio arquivo SQL traz os comandos de desfazer).

O `delete` remove as linhas — nem o sistema nem a API as devolvem depois. Os
backups automáticos do Supabase, porém, podem guardar uma cópia dentro da janela
de retenção do plano; se a exigência for não restar registro em lugar nenhum, o
passo final é excluir o projeto do Supabase. Evoluções, prescrições, receitas e
solicitações não entram nessa conta: nunca chegaram ao banco.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

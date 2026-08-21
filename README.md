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

O domínio `csv.pedrovinces.com.br` já está fixado em `public/CNAME`, que o build copia para
`dist/`. (A variável `CUSTOM_DOMAIN`, se existir em Settings → Secrets and variables → Actions →
Variables, sobrescreve esse valor — útil para publicar em outro domínio sem mexer no código.)

No DNS da Locaweb, crie um registro `CNAME`:

| Campo | Valor |
| --- | --- |
| Tipo | `CNAME` |
| Nome / Host | `csv` |
| Aponta para / Valor | `pedrovinces.github.io.` |
| TTL | padrão |

Depois, em **Settings → Pages → Custom domain**, informe `csv.pedrovinces.com.br`, aguarde a
verificação e marque **Enforce HTTPS**.

### 3. Liberar o domínio no Supabase

Em **Authentication → URL Configuration**, coloque `https://csv.pedrovinces.com.br` como
**Site URL** e também na lista de **Redirect URLs**. Sem isso o login falha no domínio novo.

### Detalhes que o Pages exige

- **Rotas internas**: o Pages não reescreve URLs, então o workflow copia `index.html` para
  `404.html`. É isso que faz `/pacientes` funcionar ao abrir direto ou recarregar.
- **`.nojekyll`**: evita que o Jekyll descarte arquivos iniciados por `_`.
- **Variáveis de ambiente**: as `VITE_SUPABASE_*` do `.env` são embutidas no bundle durante o
  build. A chave _publishable_ é pública por definição — quem protege os dados é o RLS.

### Antes de expor em um domínio público

O site fica acessível a qualquer pessoa na internet (a tela de login, não os dados). As políticas
de RLS liberam leitura e escrita para **qualquer usuário autenticado**, então vale conferir no
Supabase, em **Authentication → Providers**, se o autocadastro (`Enable email signup`) está
**desligado** — caso contrário alguém poderia criar a própria conta e alcançar os dados dos
pacientes. As contas devem ser criadas apenas pelo painel do Supabase.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# Hospedagem

O site é estático: `npm run build` gera a pasta `dist/`, e qualquer servidor de
arquivos a entrega. Toda a persistência acontece no Supabase, chamado direto do
navegador — não há servidor de aplicação para manter.

Hoje há duas hospedagens possíveis, e a escolha entre elas se resume a uma
pergunta: **quantos domínios precisam servir o sistema?**

|                   | GitHub Pages                                   | Cloudflare Pages             |
| ----------------- | ---------------------------------------------- | ---------------------------- |
| domínios próprios | um só                                          | vários no mesmo site         |
| publicação        | Actions (`.github/workflows/deploy-pages.yml`) | integração com o repositório |
| HTTPS             | automático                                     | automático                   |

## Cloudflare Pages

### Configuração da publicação

| campo                  | valor           |
| ---------------------- | --------------- |
| Framework preset       | None (ou Vite)  |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Root directory         | (vazio)         |
| Node version           | 22              |

Não é preciso cadastrar variáveis de ambiente: a URL e a chave publicável do
Supabase estão no `.env` versionado, e o Vite as lê no build. Se um dia o `.env`
sair do repositório, aí sim `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
precisam ser cadastradas nas variáveis do projeto.

### Vários domínios

Em **Custom domains**, cada domínio é adicionado uma vez e passa a servir o
mesmo site, com certificado próprio. O que muda conforme o tipo:

- **Domínio raiz** (`exemplo.com.br`): o domínio precisa usar os servidores de
  nome da Cloudflare. O registrador (Locaweb, Registro.br) passa a apontar para
  os `*.ns.cloudflare.com` que a Cloudflare indicar, e o DNS é gerenciado lá.
- **Subdomínio** (`sistema.exemplo.com.br`): basta um registro CNAME apontando
  para `<projeto>.pages.dev` no DNS atual, sem mudar servidores de nome.

O sistema não se importa com o domínio de onde é servido: o acesso é por senha
direta, sem o vaivém de redirecionamento que exigiria cadastrar endereços
autorizados no Supabase. Os pacientes são os mesmos em todos os domínios.

Uma consequência que vale saber: cada domínio é uma origem separada para o
navegador. Quem entra por um domínio não está logado nos outros — precisa
digitar a senha em cada um.

### Ao trocar de hospedagem

Enquanto os dois estiverem no ar, o domínio pertence a quem o DNS apontar. Ao
migrar de vez:

1. Confirme o site respondendo em `<projeto>.pages.dev`.
2. Aponte o domínio para a Cloudflare (servidores de nome ou CNAME).
3. Remova o domínio em **Settings → Pages** no GitHub, apague `public/CNAME` e a
   variável `CUSTOM_DOMAIN` do repositório.
4. Se não quiser mais duas publicações, desative o workflow
   `.github/workflows/deploy-pages.yml`.

## Rede interna do hospital

Sem internet, o caminho é o mesmo build: `npm ci && npm run build`, e a pasta
`dist/` servida por IIS, nginx ou Apache. Duas coisas mudam:

- O banco precisa estar dentro da rede (Supabase auto-hospedado ou equivalente),
  com as migrações de `supabase/migrations/` aplicadas e a conta de acesso
  criada. A URL e a chave entram em `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` antes do build.
- O encerramento programado precisa sair: as datas em `src/lib/encerramento.ts`
  e as tarefas de `supabase/encerramento.sql`, que existem para esta
  contingência específica e, mantidas, trancam o sistema e apagam os pacientes
  na data.

Se o site for servido em uma subpasta (`http://intranet/contingencia/`), o
`vite.config.ts` precisa da opção `base` correspondente.

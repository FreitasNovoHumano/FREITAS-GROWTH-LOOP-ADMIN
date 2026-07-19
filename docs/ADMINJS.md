# AdminJS com MongoDB e autenticação Google

O AdminJS vive no mesmo projeto e usa o mesmo MongoDB da aplicação Next.js.
Não existe banco PostgreSQL, senha administrativa paralela ou outro
`package.json`.

O processo Express carrega primeiro o `.env` central localizado em
`C:\freitas-growth\.env`, da mesma forma que a aplicação Next.js.

## Arquitetura

| Serviço | Função | Porta local |
| --- | --- | --- |
| Next.js + NextAuth | Login Google e aplicação Growth Loop | 3001 |
| Express + AdminJS | Administração dos dados Prisma | 3002 |
| MongoDB + Prisma | Banco compartilhado pelos dois processos | `DATABASE_URL` |

O NextAuth cria ou atualiza o usuário Google na coleção `User`. O papel é
recalculado em cada login: somente o e-mail que corresponde exatamente a
`ADMIN_EMAIL` recebe `ADMIN`; todos os demais recebem `CLIENT`. O middleware
também confere o e-mail e o papel antes de liberar o AdminJS.

## Arquivos do backend

| Arquivo | Responsabilidade |
| --- | --- |
| `src/server.js` | Conecta o Prisma e inicia o Express. |
| `src/app.js` | Monta segurança HTTP, AdminJS, API e erros. |
| `src/config/env.js` | Centraliza as variáveis do serviço administrativo. |
| `src/config/database.js` | Mantém o `PrismaClient` usado pelo Express. |
| `src/admin/admin.config.js` | Registra `@adminjs/prisma` e monta o router protegido. |
| `src/admin/auth.provider.js` | Valida o JWT Google/NextAuth e o perfil `ADMIN`. |
| `src/admin/resources.js` | Expõe os modelos Prisma no AdminJS. |
| `src/controllers/*.js` | Implementa a API administrativa com Prisma. |
| `src/routes/*.js` | Declara endpoints e proteção por chave de API. |
| `src/scripts/create-admin.js` | Promove um usuário Google existente para `ADMIN`. |

Os antigos modelos Sequelize foram removidos. O schema canônico está em
`prisma/schema.prisma`.

## Variáveis

```dotenv
DATABASE_URL=mongodb+srv://...
NEXTAUTH_SECRET=gere-um-segredo-forte
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAIL=admin@empresa.com
ADMIN_PORT=3002
ADMIN_LOGIN_URL=http://localhost:3001/login
ADMIN_API_KEY=gere-uma-chave-forte
GROWTH_LOOP_NEXTAUTH_URL=http://localhost:3001
```

`ADMIN_LOGIN_URL` deve apontar para o login Next.js visível pelo navegador. Em
produção, prefira publicar Next.js e AdminJS no mesmo host para que o cookie
seguro do NextAuth seja compartilhado corretamente.

## Configuração Google OAuth

No cliente OAuth do Google, autorize o callback local:

```text
http://localhost:3001/api/auth/callback/google
```

Também cadastre a origem:

```text
http://localhost:3001
```

Use os valores emitidos pelo Google em `GOOGLE_CLIENT_ID` e
`GOOGLE_CLIENT_SECRET`. O AdminJS não recebe nem armazena senha.

Se aparecer `redirect_uri_mismatch`, abra o cliente OAuth do tipo "Aplicativo
da Web" no Google Cloud Console e adicione exatamente esta URI de
redirecionamento autorizada:

```text
http://localhost:3001/api/auth/callback/google
```

O parâmetro `prompt=select_account` já força o seletor de contas. O Google só
lista contas autenticadas no perfil atual do navegador; para usar uma segunda,
selecione "Usar outra conta" e autentique-a nesse mesmo perfil.

## Instalação e primeiro acesso

```powershell
cd C:\freitas-growth\freitas-growth-loop-admin
npm install
npm run db:generate
npm run admin:dev
```

O comando `admin:dev` inicia os dois processos necessários no mesmo terminal:

- `WEB`: Next.js, login Google e prévias em `http://localhost:3001`;
- `ADMIN`: Express e AdminJS em `http://localhost:3002/admin`.

1. Acesse `http://localhost:3001/login` e entre com Google.
2. Confirme que o usuário foi criado no MongoDB.
3. Defina o mesmo e-mail em `ADMIN_EMAIL`.
4. Em outro terminal, execute `npm run admin:grant-access` quando necessário.
5. Acesse `http://localhost:3002/admin`.

O comando deve ser executado em
`C:\freitas-growth\freitas-growth-loop-admin`. A raiz
`C:\freitas-growth` é outro pacote e, intencionalmente, não possui o script
`admin:dev`.

### Porta já está em uso

Antes de iniciar, o projeto verifica as portas 3001 e 3002. Se alguma estiver
ocupada, encerre o terminal antigo com `Ctrl+C` e execute novamente:

```powershell
npm run admin:dev
```

O nodemon usa `--exitcrash`; assim, uma falha de porta encerra também o Next.js
em vez de manter metade do ambiente em execução.

Sem sessão, o AdminJS redireciona ao login Google. Um usuário autenticado com
perfil `CLIENT` recebe HTTP 403.

## API administrativa

O health check `GET /api/health` é público. As demais rotas exigem o cabeçalho
`x-admin-api-key`:

- `/api/users`
- `/api/campaigns`
- `/api/leads`

As rotas públicas montadas no Express são proxies de compatibilidade. A API
oficial e suas regras de negócio ficam nos Route Handlers do Next.js em
`/api/growth-loop`; consulte `docs/PUBLIC_CAMPAIGN_API.md`.

## Segurança e operação

- Nunca versione `.env`, tokens ou chaves OAuth.
- Mantenha `NEXTAUTH_SECRET` idêntico nos dois processos.
- O acesso depende do perfil salvo no MongoDB, não apenas do e-mail do Google.
- Não use `npm audit fix --force` sem avaliar mudanças incompatíveis.
- Os comandos desta documentação são locais e não realizam deploy.

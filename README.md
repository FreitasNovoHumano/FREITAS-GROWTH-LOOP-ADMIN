# Growth Loop

Plataforma de campanhas de indicação e geração de leads da Freitas Growth AI.

## Arquitetura

- Next.js 15 App Router e TypeScript
- MongoDB via Prisma
- NextAuth com Google OAuth
- mesmo banco, usuários e tenants (`Client`) do Freitas Growth AI
- domínio de referral isolado em `modules/growth-loop`

## Desenvolvimento

1. O projeto carrega o `.env` da aplicação principal, sem duplicar segredos. Use um `.env` local apenas para sobrescrever valores específicos.
2. Execute `npm install`.
3. Execute `npm run db:generate`.
4. Revise o schema e faça backup antes de `npm run db:push`.
5. Execute `npm run dev` e acesse `http://localhost:3001`.

O callback local do Google é `http://localhost:3001/api/auth/callback/google`.

Esse callback precisa estar autorizado no cliente OAuth do Google. Em produção,
configure `GROWTH_LOOP_NEXTAUTH_URL` com a URL pública do Growth Loop.

## AdminJS com PostgreSQL

O backend administrativo em `src/` e um processo separado do Next.js. Ele usa
`ADMIN_DATABASE_URL` para nao conflitar com o MongoDB do Prisma.

1. Crie o banco `freitas_growth_loop_admin` no PostgreSQL.
2. Copie e preencha as variaveis `ADMIN_*` de `.env.example` no `.env`.
3. Execute `npm install`.
4. Execute `npm run admin:create-user`.
5. Execute `npm run admin:dev` e acesse `http://localhost:3002/admin`.

As APIs administrativas ficam em `http://localhost:3002/api` e exigem o header
`x-admin-api-key`, exceto o health check em `/api/health`.

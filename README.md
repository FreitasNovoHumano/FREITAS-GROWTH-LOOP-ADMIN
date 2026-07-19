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
5. Execute `npm run dev`. O comando inicia a aplicação em
   `http://localhost:3001` e o AdminJS em `http://localhost:3002/admin`.

O callback local do Google é `http://localhost:3001/api/auth/callback/google`.

Esse callback precisa estar autorizado no cliente OAuth do Google. Em produção,
configure `GROWTH_LOOP_NEXTAUTH_URL` com a URL pública do Growth Loop.

## AdminJS com MongoDB e Google

O backend administrativo em `src/` é um processo separado dentro do mesmo
projeto. Ele usa o mesmo MongoDB/Prisma e reaproveita a autenticação Google do
NextAuth.

1. Preencha Google OAuth, `DATABASE_URL`, `NEXTAUTH_SECRET` e `ADMIN_EMAIL`.
2. Execute `npm run admin:dev`; esse comando inicia o Next.js e o AdminJS,
   pois o login e as prévias públicas dependem da porta 3001.
3. Entre com Google uma vez em `http://localhost:3001/login`.
4. Execute `npm run admin:grant-access` se o acesso ainda não tiver sido
   concedido e acesse `http://localhost:3002/admin`.

Execute esses comandos dentro de
`C:\freitas-growth\freitas-growth-loop-admin`. O `package.json` localizado em
`C:\freitas-growth` pertence ao projeto principal e não contém `admin:dev`.

As APIs administrativas ficam em `http://localhost:3002/api` e exigem o header
`x-admin-api-key`, exceto o health check em `/api/health`.

A arquitetura, o mapa de arquivos, todas as variáveis, endpoints, perfis e
instruções operacionais estão documentados em [docs/ADMINJS.md](docs/ADMINJS.md).

Os endpoints públicos de campanha, cadastro, convite e aceite estão descritos
em [docs/PUBLIC_CAMPAIGN_API.md](docs/PUBLIC_CAMPAIGN_API.md).

A API oficial de campanhas é servida pelo Next.js sob `/api/growth-loop`.
O Express preserva os endpoints anteriores apenas como proxies de
compatibilidade; as regras de negócio não são duplicadas.

O envio SMTP local, a caixa de entrada visual e a configuração para provedores
comerciais estão documentados em [docs/EMAIL.md](docs/EMAIL.md).

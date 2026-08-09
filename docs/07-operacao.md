# Configuração, execução e deploy

## Requisitos

- Node.js `24.x`;
- npm;
- MongoDB acessível;
- cliente OAuth 2.0 do Google;
- projeto Vercel para produção, se aplicável.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Conexão MongoDB do Prisma |
| `NEXTAUTH_SECRET` | Sim | Assinatura/criptografia do NextAuth |
| `GOOGLE_CLIENT_ID` | Sim | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Sim | OAuth Google |
| `ADMIN_EMAIL` | Recomendada | E-mail que recebe papel `ADMIN` ao primeiro login |
| `GROWTH_LOOP_NEXTAUTH_URL` | Produção | URL canônica da aplicação/callback |
| `VERCEL_URL` | Automática | Fallback de URL quando executado na Vercel |
| `NEXTAUTH_URL` | Derivada | Definida pelo projeto a partir dos valores acima |

Não publique `.env`, `.env.local` ou credenciais. Esses arquivos já estão no `.gitignore`.

## Ordem de carregamento

`next.config.ts` e `prisma.config.ts` chamam `dotenv.config()` apontando para:

```text
<diretório-pai>/.env
```

O objetivo é compartilhar o banco e credenciais com a aplicação principal. Variáveis já presentes no processo não são sobrescritas pelo `dotenv` por padrão, o que permite overrides do ambiente de execução.

## Desenvolvimento local

```bash
npm install
npm run db:generate
npm run dev
```

Abrir:

```text
http://localhost:3001
```

Configurar no Google Cloud:

```text
http://localhost:3001/api/auth/callback/google
```

## Preparação do banco

```bash
npm run db:generate
npm run db:push
```

Cuidados:

1. confirmar que `DATABASE_URL` aponta para o ambiente correto;
2. revisar `prisma/schema.prisma`;
3. realizar backup de banco compartilhado;
4. executar `db:push`;
5. validar índices únicos e dados existentes.

Não existe script de seed no projeto.

## Qualidade

Antes de integrar mudanças:

```bash
npm run typecheck
npm run lint
npm run build
```

Não há suíte automatizada de testes no repositório. Para alterações de domínio, recomenda-se adicionar testes de integração com banco isolado para idempotência, concorrência e isolamento de tenant.

## Build e execução

```bash
npm run build
npm run start
```

O build executa `prisma generate` antes de `next build`. O servidor de produção também usa a porta 3001.

## Deploy na Vercel

`vercel.json` identifica o framework Next.js. Configure no projeto:

- todas as variáveis obrigatórias;
- `GROWTH_LOOP_NEXTAUTH_URL` com a URL HTTPS final;
- callback Google `<url>/api/auth/callback/google`;
- acesso de rede do runtime ao MongoDB.

O fallback sem `GROWTH_LOOP_NEXTAUTH_URL` é:

```text
https://freitas-growth-loop-admin.vercel.app
```

## Verificações pós-deploy

1. login e logout;
2. associação correta do usuário ao tenant;
3. criação de campanha;
4. ativação e abertura da página pública;
5. cadastro direto;
6. cadastro por link de indicação;
7. qualificação após acesso inicial;
8. aparecimento de lead/participante/recompensa;
9. exportação CSV e auditoria;
10. bloqueio de acesso entre tenants.

## Observabilidade atual

O projeto não configura logger estruturado, tracing, métricas, error tracking ou health check. Falhas aparecem no console/runtime e alguns eventos ficam registrados nas tabelas de auditoria, e-mail, webhook ou domínio quando o código correspondente os cria.

## Recuperação e manutenção

- backups e retenção dependem do provedor MongoDB;
- eventos `PENDING` não são processados automaticamente;
- grants não expiram automaticamente;
- campanhas não mudam de status com base em `startsAt`/`endsAt`;
- não há job de retry de webhook ou e-mail.


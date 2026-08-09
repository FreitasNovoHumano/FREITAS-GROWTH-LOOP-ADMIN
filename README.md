# Freitas Growth Loop Admin

Plataforma multiempresa para criar e operar campanhas de indicação, capturar leads, acompanhar participantes e liberar recompensas por marcos de conversão.

## Estado atual

O projeto possui um fluxo funcional de ponta a ponta para:

- autenticação administrativa com Google;
- criação, ativação e pausa de campanhas;
- publicação de página pública por `slug`;
- cadastro de participante com consentimento;
- criação/atualização de lead;
- atribuição de indicação por código;
- liberação idempotente da recompensa inicial;
- qualificação da indicação após o acesso à recompensa inicial;
- liberação idempotente da recompensa de marco;
- listagem administrativa e exportação auditada de leads.

Algumas áreas do painel são demonstrativas ou estão apenas modeladas no banco. Consulte [Status da implementação](docs/09-status-e-evolucao.md) antes de considerar uma funcionalidade pronta para produção.

## Tecnologias

- Next.js 15.5 com App Router
- React 18 e TypeScript 5
- MongoDB com Prisma 6
- NextAuth 4 com Google OAuth
- Zod para validação
- Lucide React para ícones
- CSS global responsivo
- Vercel como destino de implantação

## Início rápido

Pré-requisitos: Node.js 24, MongoDB e credenciais OAuth do Google.

```bash
npm install
npm run db:generate
npm run dev
```

A aplicação local usa `http://localhost:3001`. O callback OAuth local é:

```text
http://localhost:3001/api/auth/callback/google
```

O projeto tenta carregar primeiro o arquivo `.env` do diretório pai. Arquivos `.env*` locais podem sobrescrever valores conforme o ambiente.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o Next.js na porta 3001 |
| `npm run build` | Gera o Prisma Client e cria o build de produção |
| `npm run start` | Inicia o build na porta 3001 |
| `npm run lint` | Executa ESLint |
| `npm run typecheck` | Valida tipos sem emitir arquivos |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:push` | Sincroniza o schema com o MongoDB |

> Faça backup e revise o schema antes de executar `db:push` em um banco compartilhado.

## Documentação

1. [Visão geral e escopo](docs/01-visao-geral.md)
2. [Arquitetura e estrutura](docs/02-arquitetura.md)
3. [Funcionalidades](docs/03-funcionalidades.md)
4. [Fluxos de negócio](docs/04-fluxos.md)
5. [API HTTP](docs/05-api.md)
6. [Modelo de dados](docs/06-modelo-de-dados.md)
7. [Configuração, execução e deploy](docs/07-operacao.md)
8. [Segurança, autorização e LGPD](docs/08-seguranca-e-lgpd.md)
9. [Status, limitações e evolução](docs/09-status-e-evolucao.md)

## Estrutura resumida

```text
app/                  Rotas, layouts, páginas e Route Handlers
components/           Componentes de interface
lib/                  Autenticação, autorização, Prisma e segurança
modules/growth-loop/  Regras de domínio e schemas Zod
prisma/               Schema do MongoDB
types/                Extensões de tipos
docs/                 Documentação técnica e funcional
```

## Rotas principais

| Rota | Acesso | Uso |
| --- | --- | --- |
| `/login` | Público | Autenticação Google |
| `/dashboard` | Autenticado | Painel administrativo |
| `/dashboard/campaigns` | Autenticado | Gestão de campanhas |
| `/growth-loop/[slug]` | Público | Experiência de cadastro e compartilhamento |
| `/api/admin/*` | Autenticado | API administrativa |
| `/api/public/*` | Público ou token do participante | API da campanha pública |

# API pública de campanhas

## Fonte de verdade

**API oficial das campanhas: Next.js.**

As regras de cadastro, associação de indicadores, recompensa e e-mail ficam em
`modules/growth-loop/domain/public-campaign-service.ts`. Os Route Handlers do
Next.js são a interface pública oficial. O Express/AdminJS não possui mais uma
segunda implementação: ele encaminha as chamadas para a API oficial com timeout
de 10 segundos.

## URLs canônicas

```text
GET  /api/growth-loop/campaigns/:slug
POST /api/growth-loop/campaigns/:slug/register
GET  /api/growth-loop/campaigns/:slug/leads/:leadSlug/reward
GET  /api/campaigns/:slug/leads/:leadSlug/claim_reward
```

O cadastro aceita o contrato atual da landing page:

```json
{
  "name": "Mariana Teixeira Alves",
  "email": "mariana@empresa.example",
  "phone": "+55 31 99876-1234",
  "consent": true,
  "invited_by_lead_slug": "slug-opaco-opcional-do-indicador"
}
```

Para compatibilidade com integrações anteriores, também aceita:

```json
{
  "lead_name": "Mariana Teixeira Alves",
  "lead_email": "mariana@empresa.example",
  "lead_whatsapp": "+55 31 99876-1234",
  "invited_by_lead_slug": "slug-opaco-opcional-do-indicador"
}
```

Um slug de indicador inexistente, pertencente a outra campanha ou ao próprio
e-mail é ignorado. O cadastro continua sem `invitedByLeadId`. O link enviado no
primeiro e-mail usa os slugs da campanha e do lead. Ao ser acessado, registra o
uso da recompensa, avalia a meta do indicador e responde com HTTP 303 para o
`claimUrl` da primeira recompensa.

Os endpoints `/invite`, `/accept_invite` e `/accept-invite` foram removidos.

## Compatibilidade temporária

As URLs abaixo continuam funcionando, mas estão depreciadas:

```text
GET  /api/public/campaigns/:slug
POST /api/public/campaigns/:slug/join

GET  /api/campaigns/:slug
POST /api/campaigns/:slug/register
GET  /api/campaigns/:slug/leads/:leadSlug/reward
GET  /api/campaigns/:slug/leads/:leadSlug/claim_reward
```

As duas primeiras são aliases internos do Next.js. As demais são proxies no
Express. Nenhuma delas contém regras de negócio independentes.

## Bases de URL

```dotenv
GROWTH_LOOP_PUBLIC_BASE_URL=http://localhost:3001
GROWTH_LOOP_API_BASE_URL=http://localhost:3001
FREITAS_GROWTH_MAIN_URL=https://freitasgrowthai.app
```

- `GROWTH_LOOP_PUBLIC_BASE_URL`: origem pública usada em páginas e links de e-mail;
- `GROWTH_LOOP_API_BASE_URL`: origem da API Next.js usada pelo proxy Express;
- `FREITAS_GROWTH_MAIN_URL`: endereço estável do produto principal.

Não use URLs aleatórias de preview da Vercel nessas variáveis.

## Proteção contra abuso

Todos os endpoints públicos usam buckets de rate limit compartilhados no
MongoDB. Assim, o limite continua válido entre diferentes processos, instâncias
da Vercel e reinicializações da aplicação.

Valores padrão:

| Categoria | Limite padrão |
| --- | ---: |
| Leitura de campanha | 120 requisições por minuto, por IP e campanha |
| Cadastro | 10 requisições por minuto, por IP e campanha |
| Cadastro por e-mail | 3 requisições por minuto, por e-mail e campanha |
| Acesso à recompensa | 20 requisições por minuto, por IP e recurso |

Os limites podem ser reduzidos por ambiente:

```dotenv
GROWTH_LOOP_READ_RATE_LIMIT_PER_MINUTE=120
GROWTH_LOOP_WRITE_RATE_LIMIT_PER_MINUTE=10
GROWTH_LOOP_EMAIL_RATE_LIMIT_PER_MINUTE=3
GROWTH_LOOP_SENSITIVE_RATE_LIMIT_PER_MINUTE=20
```

Quando um limite é excedido, a API responde com HTTP 429 e inclui
`Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` e `RateLimit-Reset`.
Identificadores como IP e e-mail são transformados em SHA-256 antes de serem
usados como chave no banco.

O Express também aplica uma barreira preliminar por minuto antes de encaminhar
requisições para a API oficial. O endpoint administrativo legado
`GET /api/campaigns/:id`, autenticado por `x-admin-api-key`, continua local no
Express e não é tratado como uma rota pública.

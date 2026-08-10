# Automações multicanal

O módulo usa `DomainEvent` como outbox e `AutomationDelivery` como registro idempotente por evento, canal e destinatário. O processador interno não altera as regras de qualificação ou concessão de recompensas.

## WhatsApp

O adapter inicial é `generic-http`. Ele envia uma requisição `POST` com bearer token e JSON:

```json
{
  "to": "5511999999999",
  "message": "Mensagem renderizada",
  "instanceId": "opcional"
}
```

O gateway deve responder com HTTP 2xx. Opcionalmente, pode retornar `{ "id": "..." }` ou `{ "messageId": "..." }`.

A configuração preferencial é feita por empresa no painel e armazenada de forma criptografada em `Integration`. Como fallback da plataforma, são aceitas:

- `WHATSAPP_PROVIDER=generic-http`
- `WHATSAPP_API_URL=https://...`
- `WHATSAPP_API_TOKEN=...`
- `WHATSAPP_INSTANCE_ID=...` (opcional)

O token nunca é devolvido pela API administrativa.

## Processamento do outbox

Execute periodicamente:

```text
POST /api/internal/automations/process
Authorization: Bearer <CRON_SECRET>
```

O endpoint aceita `?limit=20`, processa no máximo 100 eventos por chamada e reagenda falhas para cinco minutos depois. Entregas já marcadas como enviadas não são repetidas.

## Banco de dados

O projeto usa MongoDB com Prisma. Depois de revisar a conexão do ambiente, aplique o novo model e seus índices com:

```bash
npm run db:push
```

Essa operação cria `AutomationDelivery`, seus índices e os campos opcionais de telefone em `Invitation`.

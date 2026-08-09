# API HTTP

## Convenções

- JSON é usado nas APIs, exceto na exportação CSV.
- Endpoints `/api/admin/*` exigem sessão NextAuth.
- Endpoints públicos de campanha não exigem sessão.
- O acesso à recompensa exige `Authorization: Bearer <accessToken>`.
- Datas Prisma são serializadas em ISO 8601.
- Não há versionamento funcional: `/api/v1` é apenas um placeholder.

## Matriz de endpoints

| Método e rota | Autenticação | Finalidade |
| --- | --- | --- |
| `GET /api/auth/[...nextauth]` | NextAuth | Fluxos de autenticação |
| `POST /api/auth/[...nextauth]` | NextAuth | Fluxos de autenticação |
| `GET /api/admin/campaigns` | Sessão | Lista campanhas do tenant |
| `POST /api/admin/campaigns` | Sessão | Cria campanha completa |
| `PATCH /api/admin/campaigns/:id` | Sessão | Atualiza status, nome ou descrição |
| `GET /api/admin/data/:resource` | Sessão | Lista leads, participantes, rewards ou fraudes |
| `GET /api/admin/export/leads` | Sessão | Exporta leads em CSV |
| `GET /api/public/campaigns/:slug` | Público | Obtém campanha ativa |
| `POST /api/public/campaigns/:slug/join` | Público | Cadastra participante |
| `POST /api/public/participants/:id/reward-access` | Bearer token | Confirma acesso e obtém recompensas |

## Endpoints administrativos

### `GET /api/admin/campaigns`

Query opcional:

| Campo | Uso |
| --- | --- |
| `clientId` | Somente `ADMIN`; seleciona tenant |

Resposta `200`: array de campanhas, incluindo `_count.participants`, `_count.leads` e `_count.referrals`.

Erros:

- `403`: não autenticado, sem empresa vinculada ou falha de autorização;
- `500`: erro interno.

### `POST /api/admin/campaigns`

Corpo:

```json
{
  "name": "Indique e Ganhe",
  "slug": "indique-e-ganhe",
  "description": "Convide seus contatos.",
  "initialRewardTitle": "Guia de crescimento",
  "initialRewardValue": "Link de acesso",
  "milestoneRewardTitle": "Consultoria estratégica",
  "milestoneRewardValue": "Sessão de 45 minutos",
  "qualifiedReferralGoal": 3,
  "primaryColor": "#7c3aed",
  "clientId": "opcional-para-admin"
}
```

Validações principais:

- `name`: 3–100;
- `slug`: letras minúsculas, números e hífens;
- `description`: até 500;
- títulos: 3–120;
- valores: até 200;
- meta: inteiro de 1 a 100;
- cor: hexadecimal de seis dígitos.

Respostas:

- `201`: campanha criada;
- `400`: dados inválidos;
- `403`: problema de autorização/tenant;
- `500`: erro de persistência, incluindo conflito de `slug` dentro do tenant.

### `PATCH /api/admin/campaigns/:id`

Corpo parcial:

```json
{
  "status": "ACTIVE",
  "name": "Novo nome",
  "description": "Nova descrição"
}
```

Valores de status: `DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`, `ARCHIVED`.

Respostas:

- `200`: campanha atualizada;
- `404`: ID não pertence ao tenant;
- `400`: entrada inválida ou erro.

### `GET /api/admin/data/:resource`

Recursos:

| Recurso | Inclusões | Limite |
| --- | --- | --- |
| `leads` | nome da campanha | 200 |
| `participants` | campanha e contagem de referrals/grants | 200 |
| `rewards` | participante e recompensa | 200 |
| `fraud` | participante | 200 |

Retorna `404` para recurso inválido. A implementação converte qualquer outra exceção para `403`.

### `GET /api/admin/export/leads`

Retorna:

```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="growth-loop-leads.csv"
Cache-Control: no-store
```

Não há paginação ou limite na exportação.

## Endpoints públicos

### `GET /api/public/campaigns/:slug`

Retorna somente campanha com status `ACTIVE` e sua página.

Resposta `404`:

```json
{ "error": "Campanha indisponível" }
```

Observação: o `slug` é único apenas dentro do tenant no schema, mas esta consulta não recebe nem filtra `clientId`. Slugs iguais em tenants diferentes podem produzir resultado ambíguo.

### `POST /api/public/campaigns/:slug/join`

Corpo:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "phone": "(11) 99999-9999",
  "referralCode": "opcional",
  "consent": true
}
```

Resposta `201`:

```json
{
  "participantId": "id",
  "referralCode": "codigo-individual",
  "accessToken": "token-opaco"
}
```

Erros:

- `400`: validação ou erro de persistência;
- `404`: campanha inativa/inexistente;
- `409`: e-mail já participante ou autorreferência.

O token só é devolvido nessa resposta. O banco armazena apenas seu hash.

### `POST /api/public/participants/:id/reward-access`

Header:

```text
Authorization: Bearer <accessToken>
```

Resposta `200`:

```json
{
  "rewards": [
    {
      "id": "grant-id",
      "title": "Guia de crescimento",
      "value": "Link de acesso",
      "url": null
    }
  ]
}
```

Efeitos colaterais:

- atualiza `initialRewardAccessedAt`;
- tenta qualificar a indicação recebida;
- pode liberar a recompensa de marco ao indicador.

Erros:

- `404`: participante inexistente;
- `403`: token ausente ou inválido.

## Lacunas de contrato

- não existe OpenAPI;
- erros não seguem um envelope único;
- não há rate limiting;
- não há paginação;
- não há endpoints de edição completa, exclusão, convite, claim, templates, integrações, fraude ou webhooks;
- o endpoint público de cadastro não possui transação explícita envolvendo todas as gravações.


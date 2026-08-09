# Fluxos de negócio

## 1. Login e resolução de tenant

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as /login
    participant NA as NextAuth
    participant G as Google
    participant DB as MongoDB

    U->>UI: Continuar com Google
    UI->>NA: signIn google
    NA->>G: OAuth
    G-->>NA: identidade
    NA->>DB: buscar User por e-mail
    alt usuário não existe
        NA->>DB: criar User
    end
    alt papel CLIENT sem clientId
        NA->>DB: buscar Client pelo mesmo e-mail
        NA->>DB: vincular clientId se encontrado
    end
    NA-->>UI: JWT e sessão enriquecida
    UI->>UI: redirecionar /dashboard
```

Se um usuário `CLIENT` não estiver vinculado a um cliente, endpoints administrativos retornam “Nenhuma empresa vinculada”.

## 2. Criação da campanha

```mermaid
sequenceDiagram
    actor A as Operador
    participant F as CampaignForm
    participant API as POST /api/admin/campaigns
    participant AUTH as requireTenant
    participant DB as MongoDB

    A->>F: preenche proposta, recompensas e identidade
    F->>API: JSON da campanha
    API->>API: campaignSchema.parse
    API->>AUTH: resolver usuário e tenant
    AUTH-->>API: clientId e userId
    API->>DB: criar campanha, página, regras e rewards
    API->>DB: criar AuditLog
    API-->>F: 201 + campanha
    F->>F: redirecionar para listagem
```

A campanha nasce `DRAFT` e só aparece publicamente após ser ativada.

## 3. Cadastro direto

```mermaid
sequenceDiagram
    actor P as Participante
    participant UI as Página pública
    participant JOIN as POST /join
    participant DB as MongoDB
    participant ACCESS as POST /reward-access

    P->>UI: abre campanha ativa
    P->>UI: informa dados e consente
    UI->>JOIN: cadastro sem ref
    JOIN->>DB: criar Participant + Consent
    JOIN->>DB: upsert Lead
    JOIN->>DB: conceder reward INITIAL
    JOIN->>DB: criar DomainEvent
    JOIN-->>UI: participantId, referralCode, accessToken
    UI->>ACCESS: Bearer accessToken
    ACCESS->>DB: registrar initialRewardAccessedAt
    ACCESS-->>UI: recompensas
    UI-->>P: sucesso e link individual
```

## 4. Cadastro indicado e qualificação

```mermaid
sequenceDiagram
    actor I as Indicador
    actor R as Indicado
    participant UI as Página pública
    participant JOIN as POST /join
    participant ACCESS as POST /reward-access
    participant REF as qualifyReferral
    participant REWARD as evaluateMilestone
    participant DB as MongoDB

    I-->>R: /growth-loop/slug?ref=codigo
    R->>UI: abre e preenche cadastro
    UI->>JOIN: dados + referralCode
    JOIN->>DB: resolver indicador
    JOIN->>DB: criar indicado, lead e Referral REGISTERED
    JOIN-->>UI: token do indicado
    UI->>ACCESS: confirmar acesso inicial
    ACCESS->>REF: avaliar Referral
    REF->>DB: marcar QUALIFIED
    REF->>REWARD: avaliar meta do indicador
    REWARD->>DB: recalcular qualifiedReferralCount
    alt meta atingida
        REWARD->>DB: upsert RewardGrant MILESTONE
    end
```

## 5. Máquina de estados

### Campanha

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> ACTIVE
    ACTIVE --> PAUSED
    PAUSED --> ACTIVE
    ACTIVE --> ENDED
    DRAFT --> ARCHIVED
    PAUSED --> ARCHIVED
    ENDED --> ARCHIVED
```

A API aceita qualquer um dos cinco estados sem impor transições. O diagrama representa o fluxo de negócio esperado; a interface só alterna `ACTIVE` e `PAUSED/ACTIVE`.

### Indicação

```mermaid
stateDiagram-v2
    [*] --> CLICKED
    CLICKED --> REGISTERED
    REGISTERED --> VALIDATED
    VALIDATED --> QUALIFIED
    CLICKED --> REJECTED
    REGISTERED --> REJECTED
    VALIDATED --> REJECTED
```

O fluxo implementado cria diretamente em `REGISTERED` e depois muda diretamente para `QUALIFIED`.

### Concessão de recompensa

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> AVAILABLE
    AVAILABLE --> CLAIMED
    AVAILABLE --> REVOKED
    AVAILABLE --> EXPIRED
```

O código atual cria a concessão diretamente como `AVAILABLE`. Resgate, revogação e expiração ainda não têm endpoints.

## 6. Exportação de leads

1. usuário autenticado solicita `/api/admin/export/leads`;
2. tenant é resolvido pela sessão;
3. todos os leads do tenant são carregados;
4. auditoria é gravada;
5. CSV é retornado como download sem cache.

## Regras de idempotência

| Operação | Chave |
| --- | --- |
| Concessão | `campaignId:participantId:rewardId:ruleVersionId:milestone` |
| Evento de cadastro | `participant-registered:<participantId>` |
| Claim futuro | `RewardClaim.idempotencyKey` |
| Webhook futuro | `endpointId + eventId` |


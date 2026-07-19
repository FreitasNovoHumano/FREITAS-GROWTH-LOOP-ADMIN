# Seed realista do Growth Loop

O comando `npm run db:seed-growth-loop` cria ou atualiza três campanhas ativas,
30 leads/participantes, 27 convites e 27 indicações no MongoDB configurado.

- Não cria `User` nem `Client`: utiliza registros já existentes.
- Não apaga dados e não chama `delete` ou `deleteMany`.
- É idempotente: pode ser repetido sem duplicar os registros do seed.
- Não usa Faker, `Math.random` ou valores gerados aleatoriamente.
- Os e-mails usam o domínio reservado `.example`, evitando contato acidental.

Por padrão, o proprietário é o usuário de `ADMIN_EMAIL` e o cliente associado a
ele. Para selecionar outros registros já existentes, defina `SEED_USER_EMAIL`
e/ou `SEED_CLIENT_EMAIL` antes da execução.

```powershell
cd C:\freitas-growth\freitas-growth-loop-admin
npm run db:generate
npm run db:seed-growth-loop
```

## Migração de leads e associações

A evolução para slugs de lead e `LeadCampaign` possui um backfill idempotente.
Primeiro inspecione o impacto sem escrever:

```powershell
npm run db:migrate-lead-campaigns:dry-run
```

Depois de realizar backup do MongoDB, aplique em lotes:

```powershell
npm run db:migrate-lead-campaigns -- --batch-size=100
npm run db:push
```

O script não remove documentos. Ele preserva slugs e associações existentes,
infere indicadores a partir de `Referral` quando possível e cria um índice
parcial único somente para leads que já possuem slug.

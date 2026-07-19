# Envio de e-mails

## Desenvolvimento local

O projeto usa emailjs como cliente SMTP e MailDev como servidor local. O MailDev
recebe as mensagens sem entregá-las na internet e oferece uma caixa de entrada
visual no navegador.

Ao executar:

```powershell
npm run dev
```

serão iniciados:

| Serviço | Endereço |
| --- | --- |
| SMTP local | `127.0.0.1:1025` |
| Caixa de entrada MailDev | `http://localhost:1080` |
| Next.js | `http://localhost:3001` |
| AdminJS | `http://localhost:3002/admin` |

Para iniciar somente a caixa de e-mail:

```powershell
npm run email:dev
```

Para enviar uma mensagem de diagnóstico:

```powershell
npm run email:test
```

Depois, abra `http://localhost:1080` para visualizar HTML, texto, cabeçalhos e
destinatários da mensagem.

## Configuração SMTP

Configuração local padrão:

```dotenv
EMAIL_FROM=Growth Loop <growth-loop@localhost>
EMAIL_PREVIEW_URL=http://localhost:1080
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_STARTTLS=false
SMTP_USER=
SMTP_PASS=
```

Para usar um serviço SMTP comercial, altere somente o ambiente:

```dotenv
EMAIL_FROM=Growth Loop <contato@seu-dominio.com>
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_STARTTLS=true
SMTP_USER=usuario-do-provedor
SMTP_PASS=senha-ou-api-key-do-provedor
```

Use `SMTP_STARTTLS=true` para STARTTLS, normalmente na porta 587. Use
`SMTP_SECURE=true` para TLS implícito, normalmente na porta 465.
Em desenvolvimento com SMTP externo, execute `npm run dev:app` para não iniciar
o MailDev.

Nunca versione credenciais reais. Em produção, `SMTP_HOST` é obrigatório e
`SMTP_USER`/`SMTP_PASS` devem ser configurados em conjunto.

## Endpoints que enviam mensagens

| Evento | Endpoint | Destinatário |
| --- | --- | --- |
| Cadastro concluído | `POST /api/growth-loop/campaigns/:slug/register` | participante |
| Meta atingida | `GET /api/growth-loop/campaigns/:slug/leads/:leadSlug/reward` | participante indicador |

As URLs legadas chamam os mesmos handlers e, portanto, não geram uma segunda
implementação de envio.

## Templates

Quando existem templates ativos no MongoDB, são reconhecidas estas chaves:

- `FIRST_REWARD` ou `INITIAL_REWARD`;
- `SECOND_REWARD` ou `MILESTONE_REWARD`.

Variáveis disponíveis nos corpos HTML incluem:

```text
{{participantName}}
{{campaignName}}
{{rewardTitle}}
{{rewardValue}}
{{rewardUrl}}
{{qualifiedReferralGoal}}
```

Valores interpolados são escapados antes de entrar no HTML.

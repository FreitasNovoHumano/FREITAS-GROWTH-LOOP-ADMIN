# Segurança, autorização e LGPD

## Controles implementados

### Autenticação

- Google OAuth via NextAuth;
- sessão JWT assinada com `NEXTAUTH_SECRET`;
- páginas administrativas e APIs protegidas por middleware;
- sessão enriquecida com `id`, `role` e `clientId`.

### Autorização por tenant

- tenant resolvido no servidor;
- usuário `CLIENT` não pode escolher outro `clientId`;
- consultas administrativas filtradas por `clientId`;
- atualização de campanha valida pertencimento antes da mutação.

### Tokens e hashes

- token do participante: 32 bytes aleatórios em Base64URL;
- banco armazena SHA-256, não o token em texto;
- código de indicação: 6 bytes aleatórios em Base64URL;
- IP e user-agent são armazenados como SHA-256 nos consentimentos;
- comparação do token ocorre após hash no servidor.

### Validação e consistência

- Zod valida criação de campanha, atualização e cadastro;
- e-mail e telefone são normalizados;
- índices únicos evitam participante duplicado e grants duplicados;
- autorreferência por e-mail é bloqueada;
- exportação de leads é auditada.

## Dados pessoais tratados

| Dado | Entidade | Finalidade |
| --- | --- | --- |
| Nome e e-mail | User | autenticação e operação |
| Nome, e-mail e telefone | Participant/Lead | participação e aquisição |
| IP e user-agent em hash | Consent | evidência do aceite |
| Imagem do Google | User | identificação visual |
| Histórico de indicação | Referral | atribuição e recompensa |
| Recompensas | RewardGrant/Claim | cumprimento da campanha |
| Logs de ação | AuditLog | segurança e responsabilização |

## Consentimento

O cadastro exige aceite único na interface e persiste dois registros:

- `TERMS`, versão `1.0`, com hashes de IP e user-agent;
- `PRIVACY`, versão `1.0`.

Pontos a completar para uma operação LGPD madura:

- links reais e versionados para Termos e Política;
- texto granular para marketing;
- registro da origem/base legal;
- revogação de consentimento;
- atendimento de acesso, correção, portabilidade e exclusão;
- política de retenção;
- anonimização;
- identificação de controlador, operador e subprocessadores.

## Riscos e recomendações

### Prioridade alta

1. **Slug público sem tenant**: a unicidade é por tenant, mas a busca pública usa apenas `slug`. Tornar o slug globalmente único ou incluir domínio/tenant na resolução.
2. **Rate limiting ausente**: proteger login, join e reward-access contra abuso e enumeração.
3. **Cadastro não transacional**: agrupar participante, lead, referral, grant e evento ou criar reconciliação idempotente.
4. **E-mail considerado verificado**: implementar verificação real ou desativar a regra nominal.
5. **Erros públicos**: evitar retornar mensagens internas do banco/Zod.

### Prioridade média

1. aplicar CSRF/origin checks apropriados aos endpoints públicos mutáveis;
2. comparar hashes de token em tempo constante;
3. validar força e presença de segredos no boot;
4. registrar tentativas de acesso inválidas;
5. limitar volume e proteger CSV contra formula injection;
6. criar política explícita de sessão e revogação;
7. adicionar headers de segurança/CSP, especialmente pelo carregamento do Google Fonts;
8. criptografar configurações de integrações com gestão de chaves;
9. incluir ator e tenant em todas as operações sensíveis.

## Resposta a incidentes

O projeto ainda não define playbook. O mínimo recomendado:

1. revogar credenciais OAuth e segredos afetados;
2. rotacionar `NEXTAUTH_SECRET` quando necessário;
3. desativar integrações/webhooks comprometidos;
4. preservar `AuditLog` e logs do provedor;
5. identificar tenants e titulares afetados;
6. cumprir prazos legais de avaliação/notificação;
7. corrigir, validar e documentar o incidente.


# Status, limitações e evolução

## Legenda

- **Funcional**: integrado à API e ao banco.
- **Parcial**: existe, mas faltam partes importantes.
- **Demonstrativo**: interface com conteúdo fixo ou ação sem implementação.
- **Modelado**: existe no schema, sem fluxo de aplicação.

## Matriz de maturidade

| Área | Status | Evidência |
| --- | --- | --- |
| Login Google | Funcional | NextAuth, JWT e callbacks |
| Resolução de tenant | Funcional | `requireTenant` e filtros Prisma |
| Criação de campanha | Funcional | API, Zod, regras e rewards aninhados |
| Listagem de campanhas | Funcional | API com contagens |
| Ativar/pausar campanha | Funcional | PATCH e auditoria |
| Editar/excluir campanha | Parcial | API só aceita nome/descrição/status; sem tela/exclusão |
| Página pública | Funcional | campanha ativa, conteúdo e cor |
| Cadastro/consentimento | Funcional | participante, lead e consentimentos |
| Link de indicação | Funcional | `ref`, código e Referral |
| Recompensa inicial | Funcional | grant idempotente e endpoint de acesso |
| Qualificação | Funcional com simplificações | e-mail já nasce verificado |
| Recompensa de meta | Funcional | contagem e grant idempotente |
| Leads/participantes | Funcional | tabelas até 200 registros |
| Exportação CSV | Funcional | todos os leads + auditoria |
| Lista de recompensas | Funcional | lê grants existentes |
| Dashboard | Demonstrativo | métricas e gráfico fixos |
| Relatórios | Demonstrativo | funil e insights fixos |
| E-mails | Demonstrativo/Modelado | cards fixos; schema preparado |
| Antifraude | Parcial/Modelado | lista casos; sem detector ou revisão |
| Configurações | Demonstrativo | botões sem navegação/ação |
| Convites nominais | Modelado | models sem endpoints |
| Resgate de reward | Modelado | `RewardClaim` sem fluxo |
| Integrações | Modelado | configuração sem serviço |
| Webhooks | Modelado | endpoint/delivery sem dispatcher |
| Eventos assíncronos | Parcial | outbox grava; não processa |
| API v1 | Placeholder | handlers sem resposta |
| Testes automatizados | Ausente | sem scripts/arquivos de teste |

## Limitações funcionais conhecidas

- dashboard e relatórios não refletem o banco;
- status visual usa sempre a classe verde `active`;
- filtro de status de campanhas não funciona;
- busca é local e limitada ao conjunto carregado;
- tabelas não têm paginação;
- erro de fetch pode aparecer como lista vazia;
- não há loading/error boundaries do App Router;
- não há edição do conteúdo da página pública;
- `startsAt` e `endsAt` não controlam disponibilidade;
- rewards do tipo link são criados sem `claimUrl`;
- o acesso inicial é disparado automaticamente pela tela, não por clique real no benefício;
- Web Share API não possui fallback além de copiar o link;
- não existe confirmação de e-mail;
- não existe recuperação do token do participante;
- não existe área autenticada do participante.

## Limitações técnicas

- operações de cadastro distribuídas em várias writes sem transação;
- consulta pública por `slug` pode colidir entre tenants;
- erros não são padronizados;
- ausência de rate limiting;
- ausência de observabilidade;
- ausência de testes;
- ausência de worker para `DomainEvent`;
- models preparados podem dar impressão de funcionalidade inexistente;
- regras versionadas são criadas, mas a qualificação usa condições fixas e `ruleVersion: 1`;
- escolha de `ruleVersions[0]` para reward inicial não ordena explicitamente;
- middleware autentica, mas a API também depende de cada handler aplicar corretamente `requireTenant`.

## Roadmap recomendado

### Fase 1 — robustez do núcleo

1. resolver slug público de forma segura por tenant;
2. tornar cadastro e efeitos idempotentes/transacionais;
3. padronizar respostas de erro;
4. implementar rate limiting e proteção antiabuso;
5. adicionar testes de domínio, API e tenant;
6. implementar verificação real de e-mail;
7. validar regras pela versão registrada, não por condições fixas.

### Fase 2 — operação real

1. métricas do dashboard e relatórios a partir do banco;
2. paginação, filtros e estados de erro;
3. edição completa de campanha e página;
4. entrega e claim de recompensas;
5. lifecycle por data e status;
6. tela de detalhes do participante;
7. revisão de casos de fraude.

### Fase 3 — automação

1. worker de `DomainEvent`;
2. templates e envio de e-mail com Resend;
3. webhooks com assinatura e retry;
4. integrações CRM;
5. convites nominais;
6. notificações operacionais.

### Fase 4 — governança e escala

1. portal de direitos LGPD e retenção;
2. papéis e permissões granulares;
3. observabilidade e alertas;
4. auditoria ampliada;
5. proteção contra fraude baseada em sinais;
6. documentação OpenAPI e versionamento real.

## Critérios mínimos para produção

- testes automatizados cobrindo isolamento e idempotência;
- slug público sem ambiguidade;
- rate limiting;
- verificação de e-mail coerente com a regra;
- transação ou reconciliação do cadastro;
- links reais de termos e privacidade;
- monitoramento de erros;
- backup e restauração testados;
- fluxo real de entrega da recompensa;
- revisão de segurança e privacidade.


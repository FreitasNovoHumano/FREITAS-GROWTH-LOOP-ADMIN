# Funcionalidades

## Autenticação e acesso

### Login Google

- tela em `/login`;
- `signIn("google")` com retorno para `/dashboard`;
- seletor de conta sempre exibido por `prompt=select_account`;
- sessão JWT com duração máxima de 30 dias;
- logout com retorno à tela de login.

No primeiro login, um `User` é criado. O e-mail definido por `ADMIN_EMAIL` recebe papel `ADMIN`; os demais recebem `CLIENT`. Para clientes, o sistema procura um `Client` com o mesmo e-mail e vincula seu `clientId`.

### Proteção de rotas

O middleware do NextAuth protege:

- `/dashboard/:path*`;
- `/api/admin/:path*`.

Os endpoints administrativos fazem uma segunda verificação no servidor com `requireTenant()`.

## Campanhas

### Listagem

`/dashboard/campaigns` carrega campanhas do tenant, ordenadas da mais recente para a mais antiga. Cada card exibe:

- nome, descrição e status;
- quantidade de participantes;
- quantidade de indicações;
- acesso à página pública;
- ação de ativar ou pausar.

A busca por nome é local. O seletor visual de status ainda não filtra a lista e o botão de mais opções não possui ação.

### Criação

O builder em `/dashboard/campaigns/new` coleta:

- nome;
- `slug` público;
- descrição;
- recompensa inicial;
- recompensa de marco;
- quantidade de indicações qualificadas;
- cor principal.

O `slug` é sugerido automaticamente a partir do nome. A tela inclui uma prévia responsiva da experiência.

Ao criar, a API persiste atomicamente na mesma operação Prisma:

- campanha em status `DRAFT`;
- página inicial;
- versão 1 da regra de campanha;
- recompensa `INITIAL` e sua regra versão 1;
- recompensa `MILESTONE` e sua regra versão 1.

Em seguida, cria um `AuditLog` com `CAMPAIGN_CREATED`.

### Atualização de status

O card alterna:

- `ACTIVE` para `PAUSED`;
- qualquer outro status para `ACTIVE`.

A API também aceita alteração de nome e descrição, embora a interface atual só altere status. Toda atualização gera `CAMPAIGN_UPDATED`.

## Experiência pública

A rota `/growth-loop/[slug]`:

- carrega somente campanhas `ACTIVE`;
- aceita `?ref=<codigo-de-indicacao>`;
- usa a cor principal da campanha;
- exibe proposta, recompensa inicial e formulário;
- coleta nome, e-mail, WhatsApp opcional e consentimento;
- mostra estado de sucesso e link individual de compartilhamento.

O compartilhamento usa a Web Share API quando disponível. O botão de copiar usa `navigator.clipboard`.

## Cadastro de participante

Validações:

- nome entre 2 e 100 caracteres;
- e-mail válido, até 200 caracteres;
- telefone opcional, até 30 caracteres;
- código de indicação opcional, até 30 caracteres;
- consentimento obrigatoriamente `true`.

Efeitos:

1. normaliza e-mail e telefone;
2. bloqueia e-mail duplicado na campanha;
3. resolve o indicador pelo código;
4. bloqueia autorreferência por e-mail;
5. gera código de indicação e token de acesso;
6. cria participante ativo;
7. grava consentimentos de termos e privacidade;
8. cria ou converte o lead;
9. cria a indicação, se válida e da mesma campanha;
10. concede a recompensa inicial;
11. grava o evento `ParticipantRegistered`;
12. devolve ID, código de indicação e token.

Na implementação atual, `emailVerifiedAt` é marcado no cadastro; não existe confirmação real por e-mail.

## Indicações

Uma indicação começa como `REGISTERED` quando o indicado conclui o cadastro pelo link do indicador.

Depois que o endpoint de acesso à recompensa inicial é chamado:

- `initialRewardAccessedAt` é registrado;
- a indicação recebida pelo participante é avaliada;
- cadastro, e-mail e acesso inicial precisam estar presentes;
- autorreferência é rejeitada;
- a indicação muda para `QUALIFIED`;
- a contagem do indicador é recalculada.

Não há fluxo atual que use os estados `CLICKED`, `VALIDATED` ou `REJECTED` por outros sinais além da verificação de autorreferência no serviço.

## Recompensas

### Recompensa inicial

É concedida no cadastro, com marco `REGISTRATION_COMPLETED`. A concessão usa `upsert` por chave idempotente.

### Recompensa de marco

Quando uma indicação se qualifica, o sistema:

1. conta todas as indicações `QUALIFIED` do indicador;
2. atualiza `qualifiedReferralCount`;
3. compara com `qualifiedReferralGoal`;
4. encontra a recompensa `MILESTONE`;
5. escolhe a versão numérica mais alta da regra;
6. concede o marco `QUALIFIED_<meta>`.

Também é idempotente. Não há tela ou endpoint de claim/resgate, apesar dos modelos `RewardClaim` e estados correspondentes existirem.

## Leads e participantes

As tabelas administrativas:

- limitam a consulta aos 200 registros mais recentes;
- permitem busca local em todo o JSON carregado;
- mostram campanha e campos relevantes;
- não têm paginação, ordenação interativa ou filtros no servidor.

Leads podem ser exportados integralmente em CSV. A exportação:

- escapa aspas;
- inclui nome, e-mail, telefone, campanha, origem e data;
- desabilita cache;
- grava auditoria `LEADS_EXPORTED` com a quantidade exportada.

## Áreas visuais ainda demonstrativas

- dashboard com métricas, gráfico e campanhas fixas;
- relatório com funil e insights fixos;
- cards e botões de templates de e-mail;
- configurações;
- filtro de status de campanhas;
- edição e menu de opções da campanha.

As tabelas de recompensas e fraude leem o banco, mas dependem de registros gerados por outros fluxos. Não existe motor de detecção de fraude no código atual.


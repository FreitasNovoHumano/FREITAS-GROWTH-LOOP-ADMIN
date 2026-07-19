# Alinhamento técnico com o Freitas Growth

## Referência de versões

O projeto principal `C:\freitas-growth` foi inspecionado sem alterações. Seu
`package.json` e lockfile definem Node 24, React 18.3.1, React DOM 18.3.1,
Next.js 15.5.16 e TypeScript 5.9.3. O Growth Loop preserva esses runtimes.

Os tipos foram corrigidos no Growth Loop para as linhas correspondentes:

```text
@types/node       24.13.3
@types/react      18.3.31
@types/react-dom  18.3.7
```

O projeto principal também possui tipos divergentes, mas não foi modificado.

## Dependências revisadas

| Dependência | Decisão | Motivo |
| --- | --- | --- |
| `recharts` | removida | não havia import, componente, script, teste ou configuração consumidora |
| `express-session` | mantida | peer dependency obrigatória de `@adminjs/express` |
| `express-formidable` | mantida | peer dependency e import em runtime no router do AdminJS |
| `tslib` | mantida | peer dependency obrigatória de `@adminjs/express`; `importHelpers` não está habilitado |

## Documentação do Next.js

O `AGENTS.md` do projeto principal solicita
`node_modules/next/dist/docs/`, mas esse diretório não existe no pacote
instalado `next@15.5.16` de nenhum dos dois projetos. Não foram criados ou
editados arquivos dentro de `node_modules`.

Para mudanças no Growth Loop, use nesta ordem:

1. documentação versionada em `docs/`;
2. tipos e código-fonte reais do `next@15.5.16` instalado;
3. documentação oficial da versão 15 em
   `https://nextjs.org/docs/15`, quando o acesso externo estiver permitido.

O `AGENTS.md` do projeto principal permanece inalterado.

## Rate limiting

Os endpoints públicos utilizam buckets de janela fixa persistidos na coleção
`GrowthLoopRateLimitBucket`. As atualizações usam incremento atômico do Prisma,
de forma que todas as instâncias compartilham a mesma contagem. Buckets
expirados são removidos periodicamente e não armazenam IP ou e-mail em texto
aberto.

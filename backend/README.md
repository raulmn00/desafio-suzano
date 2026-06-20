# OVGS — Backend

API REST para o ciclo de vida de **Ordens de Venda (OVs)**: cadastros, criação e
acompanhamento de OVs, central de agendamento e auditoria. Construída em
**NestJS + TypeScript** sobre **Clean Architecture**, com persistência relacional
via **Prisma/PostgreSQL**.

> **Fio condutor da solução:** o ciclo de vida da Ordem de Venda é uma **máquina
> de estados auditável**. O domínio é a fonte da verdade do estado operacional;
> cada transição (`CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE`) é
> uma invariante de negócio explícita; e toda mudança relevante grava um evento
> de auditoria imutável **na mesma transação**. A segunda invariante de primeira
> classe: *uma OV só nasce se o tipo de transporte estiver autorizado para o
> cliente.*

---

## Sumário

- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Arquitetura](#arquitetura-clean-architecture)
- [Modelagem de domínio](#estratégia-de-modelagem-do-domínio)
- [Persistência](#estratégia-de-persistência)
- [Auditoria](#auditoria)
- [Segurança e autorização](#segurança-e-autorização)
- [Testes](#testes)
- [Escalabilidade](#considerações-sobre-escalabilidade)
- [Performance](#considerações-sobre-performance)
- [Trade-offs assumidos](#trade-offs-assumidos)
- [Deploy](#deploy-cloud-run-function-gen2)

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime / linguagem | Node.js 22, TypeScript (strict) |
| Framework | NestJS 11 |
| ORM / banco | Prisma 6, PostgreSQL 16 |
| Validação | class-validator / class-transformer (borda HTTP) |
| Auth | Passport JWT, bcrypt |
| Docs | OpenAPI / Swagger (`/docs`) |
| Testes | Jest (Istanbul), Supertest |
| Container | Docker / Docker Compose |
| Deploy | Google Cloud Run function (gen2) + Neon |

## Como executar

### Pré-requisitos
Node 22, pnpm, Docker.

### 1. Banco de dados (Docker)
```bash
# na raiz do monorepo
docker compose up -d postgres
# se a porta 5432 estiver ocupada: POSTGRES_PORT=5433 docker compose up -d postgres
```

### 2. Variáveis de ambiente
```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL/DIRECT_URL conforme a porta usada
```

### 3. Dependências, migrations e seed
```bash
pnpm install
pnpm prisma migrate deploy   # aplica o schema
pnpm prisma:seed             # usuários + dados de exemplo
```

### 4. Subir a API
```bash
pnpm start:dev               # http://localhost:8080  · docs em /docs
```

### Tudo em um comando (banco + API + migrations)
```bash
docker compose --profile full up --build
```

### Credenciais semeadas
| Papel | E-mail | Senha |
|---|---|---|
| OPERADOR | `operador@ovgs.dev` | `operador123` |
| AUDITOR | `auditor@ovgs.dev` | `auditor123` |

---

## Arquitetura (Clean Architecture)

A solução é um **monólito modular** organizado por **feature** e, dentro de cada
feature, por **camada**. A regra de dependência aponta sempre para dentro:

```
┌─────────────────────────────────────────────────────────────┐
│ infrastructure  (NestJS controllers, Prisma, guards, DI)     │  ← conhece application + domain
│   ┌─────────────────────────────────────────────────────┐   │
│   │ application  (use-cases, ports/portas)               │   │  ← conhece apenas domain
│   │   ┌─────────────────────────────────────────────┐   │   │
│   │   │ domain  (entidades, VOs, máquina de estados, │   │   │  ← não conhece ninguém
│   │   │          erros, interfaces de repositório)   │   │   │
│   │   └─────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

```
src/
├── shared/                      # kernel compartilhado
│   ├── domain/                  # DomainError (categorias → HTTP)
│   ├── application/ports/       # Clock, IdGenerator, AuditLogger, TransactionManager (abstract classes)
│   └── infrastructure/          # PrismaService, adapters, DomainExceptionFilter, SharedModule
└── modules/<feature>/
    ├── domain/                  # entidade, value objects, erros, repository PORT (abstract class)
    ├── application/             # use-cases + DTOs de aplicação + presenter + repo in-memory (testes)
    └── infrastructure/          # controller, DTOs HTTP, repositório Prisma + mapper, module
```

Features: `auth`, `clientes`, `tipos-transporte`, `itens`, `ordens-venda`,
`auditoria`, `health`.

> **DECISÃO & JUSTIFICATIVA — Ports como `abstract class`.** As interfaces de
> repositório e os serviços externos (relógio, gerador de id, auditoria,
> transação) são `abstract class`. No NestJS, isso permite usá-las
> simultaneamente como **tipo** (na camada de aplicação) e como **token de
> injeção** (no módulo: `{ provide: ClienteRepository, useClass: PrismaClienteRepository }`).
> Interfaces puras não sobrevivem ao runtime e não servem de token. Os
> use-cases recebem as portas pelo construtor e são instanciáveis com `new` —
> portanto testáveis **sem** o container do Nest.

> **DECISÃO & JUSTIFICATIVA — Domínio puro, sem framework.** Entidades e value
> objects não têm decorators do Nest/Prisma. A tradução para HTTP acontece em um
> único `DomainExceptionFilter` na borda (mapeia `NotFoundError→404`,
> `ConflictError→409`, `UnauthorizedError→401`, `ForbiddenError→403`, regras de
> negócio→422). Mappers
> estáticos convertem entre o registro do Prisma e a entidade de domínio. Isso
> mantém o núcleo independente de detalhes e fácil de evoluir.

## Estratégia de modelagem do domínio

Modelagem orientada a DDD, separando **catálogo** (o que pode ser usado) de
**operação** (a Ordem de Venda e seu ciclo).

| Agregado / Entidade | Responsabilidade | Invariantes |
|---|---|---|
| **Cliente** (root) | Identidade + lista de transportes autorizados | documento (CPF/CNPJ) válido; `transporteEstaAutorizado()` é a regra que habilita a OV |
| **TipoTransporte** | Catálogo de modalidades, extensível | código único; novos tipos = novas linhas (open/closed) |
| **Item** | Catálogo pré-existente | SKU único |
| **OrdemDeVenda** (root) | Ciclo de vida + agendamento | 1 cliente · 1 transporte · ≥1 item · só transições válidas · `AGENDADA` exige agendamento confirmado |
| **AuditEvent** | Trilha imutável append-only | ator, ação, alvo, estado-antes/depois, timestamp |

**Máquina de estados (`ordens-venda/domain/status-ordem-venda.ts`):** uma tabela
de transições é a única fonte de verdade. `OrdemDeVenda.transicionarPara()`
rejeita qualquer transição fora da sequência (`TransicaoInvalidaError`). O
`Documento` é um **value object** que valida o CPF/CNPJ na construção — não
existe documento inválido em memória.

> **DECISÃO & JUSTIFICATIVA — A regra "transporte autorizado" mora no domínio.**
> A consulta `cliente.transporteEstaAutorizado(tipo)` vive na entidade Cliente, e
> o use-case `CriarOrdemVenda` a orquestra. Assim a regra de negócio mais
> importante do desafio fica explícita, testável isoladamente e impossível de
> ser contornada por uma query ad-hoc.

## Estratégia de persistência

PostgreSQL relacional via Prisma. O `schema.prisma` está pronto para **Neon**
(`url` com pooler para runtime + `directUrl` direto para migrations).

> **DECISÃO & JUSTIFICATIVA — Auditoria na MESMA transação (estilo outbox).**
> Cada use-case de mutação roda dentro de `TransactionManager.executar(...)`,
> que persiste a mudança de estado **e** grava o `AuditEvent` atomicamente. O
> `PrismaService` propaga o client transacional via `AsyncLocalStorage`, então
> repositórios e o audit logger compartilham a mesma transação sem que a camada
> de aplicação conheça o ORM. Logar auditoria "depois", best-effort, abriria uma
> janela em que a operação acontece mas o evento se perde — inaceitável para
> rastreabilidade.

> **DECISÃO & JUSTIFICATIVA — Composição em vez de herança no PrismaService.** O
> PrismaClient do Prisma 6 é um Proxy; estendê-lo faz `this` cair no target
> interno (sem os delegates de modelo). Por isso o `PrismaService` **contém** um
> PrismaClient e expõe um getter `client` que devolve o Proxy real (ou o client
> transacional quando há transação ativa).

## Auditoria

Eventos mínimos cobertos: criação de OV, alteração de status, alteração de
agendamento (definir/confirmar/reagendar) e alteração de transporte. Cada evento
registra **data/hora, ator, ação, entidade afetada e estado anterior/posterior**.
A leitura é exposta em `GET /auditoria` com filtros por entidade, ação e período
(papel AUDITOR ou OPERADOR).

## Segurança e autorização

Autenticação **JWT** e **RBAC** com dois papéis. Guards globais: `JwtAuthGuard`
(rotas `@Public()` liberadas — `/auth/login`, `/auth/refresh`, `/health`) e
`RolesGuard` (`@Roles(...)`). Senhas via bcrypt; **a autorização é decidida no
backend** — o cliente nunca é a fonte da verdade.

### Papéis (RBAC)

| Papel | Pode |
|---|---|
| `OPERADOR` | **Escrita** (cadastros, OVs, status, transporte, agendamento) **+ leitura + auditoria** |
| `AUDITOR` | **Somente leitura** de todos os recursos **+ auditoria** |

Toda rota de **escrita** é `@Roles(OPERADOR)`; as de **leitura** ficam abertas a
qualquer autenticado; `GET /auditoria` aceita ambos. O guard de autorização roda
**antes** da validação de corpo e do "não encontrado" — um AUDITOR recebe `403`
mesmo com payload inválido ou recurso inexistente (sem vazar informação).

### Fluxo de tokens (access curto + refresh rotacionado)

| Endpoint | Descrição |
|---|---|
| `POST /auth/login` | Valida credenciais → `{ accessToken, refreshToken, usuario }` |
| `POST /auth/refresh` | Troca um refresh válido por um **novo par** (rotação single-use) |
| `POST /auth/logout` | Revoga o access atual (denylist) **e** o refresh apresentado |

- **Access token curto** (`JWT_ACCESS_EXPIRES_IN`, padrão `15m`), com `jti`. Reduz
  a janela de exposição de um token vazado.
- **Refresh token opaco** (`JWT_REFRESH_EXPIRES_IN`, padrão `7d`): apenas o
  **hash SHA-256** é persistido (`refresh_tokens`). Cada refresh **rotaciona** —
  o antigo é revogado e um novo é emitido; reusar um refresh já gasto é detectado
  e rejeitado (`401`).

### Revogação server-side (sem esperar o token expirar)

A `JwtStrategy` **revalida cada requisição contra o estado atual do banco** — não
confia cegamente nas claims:

1. **Recheck do usuário:** carrega o usuário por `sub`; se foi **desativado** ou
   excluído → `401`. Usa o **`papel` atual** como fonte da verdade → rebaixar/
   promover vale **na hora**.
2. **Denylist por `jti`:** se o token está em `access_tokens_revogados` (logout/
   ban) → `401`, imediatamente.

> **DECISÃO & JUSTIFICATIVA — JWT semi-stateful.** JWT puro é stateless e não
> permite revogar um token antes de expirar. Optou-se por um recheck por
> requisição (1 lookup por PK, desprezível — o app já toca o banco em tudo) para
> ganhar **revogação imediata** de desativação, mudança de papel e logout, sem
> tocar no cliente. O access curto + refresh rotacionado limitam a janela de um
> token roubado e dão "deslogar de verdade".

### Parsing estrito de `Bearer`

Um extrator próprio (`extractStrictBearer`) aceita **apenas** `Bearer <token>`
(esquema case-sensitive, um único espaço, um token, sem sufixo). Rejeita
`bearer` minúsculo e `Bearer <token> lixo` que o extrator padrão do passport-jwt
aceitava silenciosamente.

### Erros localizados (PT-BR) e envelope

Todo erro responde no envelope `{ statusCode, code, message, timestamp }` com
`code` semântico. O `RolesGuard` lança `ForbiddenError` (`403`, code `FORBIDDEN`,
nomeando o papel exigido) e o `JwtAuthGuard` lança `UnauthorizedError` (`401`,
code `UNAUTHORIZED`) — ambos em português, em vez do `"Forbidden resource"` /
`"Unauthorized"` cru do Nest.

### Segredo JWT (fail-fast em produção)

Não há segredo de produção versionado. O `ConfigModule` valida o ambiente no boot
(`validateEnv`): `JWT_SECRET` é **obrigatório** sempre e, com `NODE_ENV=production`,
precisa ser **forte (≥32 chars)** e **não** ser um dos valores padrão/conhecidos
do repositório — caso contrário **a app recusa subir**. O segredo é lido com
`config.getOrThrow('JWT_SECRET')` (sem fallback silencioso).

| Variável | Padrão | Observação |
|---|---|---|
| `JWT_SECRET` | — | obrigatório; gere com `openssl rand -base64 48` em produção |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | duração do access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | duração do refresh token |

## Observabilidade & logs estruturados

Logging estruturado via **`nestjs-pino`** (pino) — substitui o `Logger` padrão do
Nest, então até os logs internos saem em **JSON** (parseado nativamente pelo
Cloud Logging).

- **Correlation id por requisição:** `x-request-id` recebido é reaproveitado (e
  **ecoado** na resposta) ou um UUID é gerado. Toda linha de log da requisição
  carrega o `reqId` → rastreabilidade ponta a ponta.
- **Request logging automático** (pino-http): método, rota, status, tempo de
  resposta, `userId`/`papel` (quando autenticado).
- **Redação de segredos:** `authorization`, `senha`, `refreshToken` e
  `accessToken` saem como `[Redacted]` — nunca em texto.
- **Formato/nível:** `pino-pretty` legível em `development`; **JSON** em
  produção/teste. Nível via `LOG_LEVEL` (padrão `info`; `silent` em teste).
- **Lógica isolada e testada:** `shared/infrastructure/logging/` (`request-id.ts`,
  `logger.config.ts`) — unit-tested; o `app.useLogger(PinoLogger)` é ligado em
  `main.ts`/`function.ts`.

> **Caveat serverless:** JSON em stdout → Cloud Logging (zero infra). Tracing
> distribuído (OpenTelemetry + collector) fica como evolução; correlation-id +
> logs estruturados já entregam observabilidade real para este deploy.

## Métricas & monitoramento

Métricas no formato **Prometheus** via `prom-client` (registry isolado, sem
poluir o global).

- **`GET /metrics`** (público, na raiz): métricas padrão do processo
  (`process_*`, `nodejs_*` — CPU, memória, event loop, GC) + **`http_requests_total`**
  (Counter) e **`http_request_duration_seconds`** (Histogram), rotuladas por
  `method` · `route` · `status_code`.
- **`MetricsInterceptor` global** mede toda requisição no evento `finish` (status
  final, inclusive erros). A label `route` é o **padrão** (`/api/v1/clientes/:id`),
  nunca a URL com ids — mantém a cardinalidade baixa; o próprio `/metrics` não se
  autocontabiliza.
- **Health:** `GET /health` (liveness) e **`GET /health/ready`** (readiness — faz
  `SELECT 1`; `503` se o banco estiver fora, para o orquestrador tirar a instância
  do balanceador).

> **Caveat serverless:** scraping Prometheus de um serviço scale-to-zero é
> impraticável; o endpoint é o padrão demonstrável (útil atrás de `--min-instances`
> ou via push/OTel). As métricas nativas da Cloud Run seguem disponíveis. Em
> produção, restrinja `/metrics` por rede/IAM.

## Testes

```bash
pnpm test           # unitários
pnpm test:cov       # unitários + cobertura (gate 95% global)
pnpm test:e2e       # integração ponta a ponta (requer Postgres no ar)
```

Estratégia por camada:
- **Domínio e use-cases:** unitários puros (sem o container do Nest), com fakes
  in-memory dos repositórios e da auditoria. A máquina de estados é testada com
  a **matriz completa** de transições válidas **e** inválidas (`it.each`).
- **Controllers:** unitários com o use-case mockado (delegação e mapeamento).
- **Repositórios Prisma:** unitários com o client mockado (cobrem mapper + ramos);
  a integração real é validada no e2e.
- **E2E (integração):** `test/app.e2e-spec.ts` sobe a app completa contra um
  Postgres real (Supertest) e exercita login + RBAC + regra de transporte
  autorizado + ciclo `CRIADA→ENTREGUE` + agendamento + auditoria.
- **Edge cases (integração):** `test/edge-cases.e2e-spec.ts` cobre
  exaustivamente as bordas — validação (`400`), regras de domínio (`422`),
  unicidade (`409`), não-encontrado (`404`), autenticação (`401`) e
  autorização (`403`): transições inválidas da máquina de estados, transporte
  não autorizado, itens duplicados, documento CPF/CNPJ inválido, agendamento
  sem confirmação, estado terminal, JSON malformado, whitelist, etc.
- **RBAC (integração):** `test/rbac.e2e-spec.ts` valida a **matriz completa**
  OPERADOR × AUDITOR × anônimo sobre todos os endpoints, as mensagens PT-BR de
  `401`/`403`, o parsing estrito do `Bearer` e a robustez do token (payload
  adulterado/expirado → `401`; negação sem efeito colateral).
- **Revogação (integração):** `test/revogacao.e2e-spec.ts` prova que desativar/
  rebaixar/promover um usuário afeta um token **já emitido** imediatamente.
- **Refresh & logout (integração):** `test/refresh-logout.e2e-spec.ts` cobre a
  rotação single-use do refresh (reuso → `401`) e o logout (denylist do access +
  revogação do refresh).
- **Observabilidade (integração):** `test/observabilidade.e2e-spec.ts` valida o
  correlation id (`x-request-id` gerado e ecoado) sem quebrar a autenticação.
- **Métricas & health (integração):** `test/metricas.e2e-spec.ts` valida o
  `/metrics` (formato Prometheus, processo + HTTP) e o liveness/readiness.

> **Cobertura:** `coverageProvider: 'babel'` (Istanbul — o provider `v8` reporta
> branches de forma imprecisa em código NestJS). Threshold global **95%**; o
> domínio e os use-cases ficam em **100%** na prática. Arquivos de wiring puro
> (`*.module.ts`, `main.ts`, `function.ts`, `*.dto.ts`, `*.decorator.ts`) são
> excluídos da métrica — não têm lógica testável em unidade e são cobertos pelo
> e2e.

## Considerações sobre escalabilidade

- **Core stateless:** a API não guarda estado em memória entre requisições;
  escala horizontalmente atrás de um balanceador (ou via instâncias da Cloud
  Run). O `AsyncLocalStorage` é por-requisição, não compartilhado.
- **Banco:** índices em `status`, `cliente_id`, `tipo_transporte_id` e
  `criado_em` (os filtros do monitoramento) e na trilha de auditoria
  (`entidade`, `ação`, `ocorrido_em`). Leituras pesadas (monitoramento,
  relatórios) podem ir para *read replicas* sem tocar no domínio.
- **Auditoria** é a tabela que mais cresce: candidata natural a particionamento
  por tempo e arquivamento de eventos antigos.
- **Serverless (Neon + Cloud Run):** connection string *pooled* (PgBouncer) e
  `connection_limit` baixo evitam esgotar conexões sob picos.

## Considerações sobre performance

- Consultas usam índices alinhados aos filtros; o monitoramento ordena por
  `criado_em` indexado.
- Auditoria limitada por página (`take`) para não materializar a tabela inteira.
- Cold start na Cloud Run mitigado por bootstrap único da app (a instância Nest
  é criada uma vez e reaproveitada) e `--min-instances` quando necessário.

## Trade-offs assumidos

- **Sem mensageria/worker assíncrono.** Diferente de domínios que integram
  provedores externos lentos, aqui a complexidade real é a **integridade do
  ciclo de estados + auditabilidade**, resolvida de forma síncrona e
  transacional. Introduzir fila seria *over-engineering* sem benefício
  proporcional.
- **Repositórios testados com mock do ORM (unidade) + integração no e2e.**
  Mockar o ORM testa o mapeamento sem subir banco (rápido, no gate de 95%); a
  fidelidade de persistência é garantida pelo e2e contra Postgres real.
- **Imagem Docker sem `prune --prod`** para manter o Prisma CLI disponível ao
  `migrate deploy` no boot — prioriza simplicidade de execução sobre tamanho.
- **Disponibilidade de agendamento simulada** (conforme permitido pelo desafio):
  o foco é a consistência do agendamento dentro do ciclo de vida, não regras de
  capacidade logística.

## Deploy (Cloud Run function gen2)

O `src/function.ts` expõe um handler `ovgs` via `@google-cloud/functions-framework`,
inicializando a app Nest uma única vez sobre uma instância Express compartilhada.
Banco gerenciado: **Neon** (`DATABASE_URL` pooled + `DIRECT_URL` para migrations).

```bash
# migrations (CI, com a DIRECT_URL)
pnpm prisma migrate deploy

# deploy
gcloud functions deploy ovgs-api \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=ovgs --trigger-http --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,JWT_ACCESS_EXPIRES_IN=15m,JWT_REFRESH_EXPIRES_IN=7d \
  --set-secrets=DATABASE_URL=...,DIRECT_URL=...,JWT_SECRET=...
```

> Com `NODE_ENV=production`, o boot **falha** se `JWT_SECRET` faltar, for fraco
> (<32 chars) ou for um valor padrão do repositório. Gere um forte:
> `openssl rand -base64 48`.

Documentação OpenAPI interativa: **`/docs`**.

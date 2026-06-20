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
> `ConflictError→409`, `UnauthorizedError→401`, regras de negócio→422). Mappers
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

Autenticação **JWT** (login em `/auth/login`) e **RBAC** com dois papéis:
`OPERADOR` (escrita) e `AUDITOR` (leitura). Guards globais: `JwtAuthGuard`
(rotas marcadas com `@Public()` são liberadas — login e health) e `RolesGuard`
(`@Roles(...)`). Senhas via bcrypt; a autorização é verificada no backend, nunca
confiando no cliente.

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
  --set-secrets=DATABASE_URL=...,DIRECT_URL=...,JWT_SECRET=...
```

Documentação OpenAPI interativa: **`/docs`**.

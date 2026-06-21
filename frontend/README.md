# OVGS — Frontend

SPA em **React + Vite + TypeScript** para o Sistema de Gestão de Ordens de Venda:
autenticação, gestão de OVs, monitoramento operacional, central de agendamento,
cadastros e auditoria. Consome a API REST do backend.

## Tecnologias

| Área | Tecnologia |
|---|---|
| UI | React 19, Vite 7, TypeScript |
| Roteamento | React Router v7 |
| Estado de servidor | TanStack Query v5 |
| HTTP | axios (instância única; injeta Bearer, renova o access no 401 e repete) |
| Validação | Zod + React Hook Form |
| Testes | Cypress (component + e2e) com cobertura (vite-plugin-istanbul + nyc) |

## Como executar

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:8080 (origem do backend)
pnpm install
pnpm dev                 # http://localhost:5173
```

Credenciais de exemplo: `operador@ovgs.dev` / `operador123` (OPERADOR) ·
`auditor@ovgs.dev` / `auditor123` (AUDITOR).

> `VITE_API_URL` é a **origem** do backend; o cliente HTTP acrescenta `/api/v1`.
> Em produção, aponte para a URL da Cloud Run.

## Estrutura (feature-based)

```
src/
├── lib/            # env (zod), http (axios + refresh automático no 401), queryClient, storage (access+refresh), validators, format
├── auth/           # AuthContext/useAuth (expõe isOperador), api (login/refresh/logout), ProtectedRoute, LoginPage
├── components/     # Layout, Nav, ui/ (Button, Input, Field, Select, Table, Badge, Spinner, ErrorAlert, Modal)
└── features/<dominio>/
    ├── api.ts      # chamadas tipadas; valida a resposta com zod (.parse) no boundary
    ├── schema.ts   # schemas zod + tipos
    ├── hooks.ts    # useQuery/useMutation
    └── pages/      # telas
```

Features: `tipos-transporte`, `itens`, `clientes`, `ordens-venda` (gestão +
monitoramento + agendamento), `auditoria`.

### Telas

- **Login** — formulário validado; persiste **access token + refresh token +
  usuário**.
- **Ordens de Venda** — listar/criar (só transportes autorizados do cliente);
  detalhe com avanço de status (apenas a próxima transição válida) e troca de
  transporte.
- **Monitoramento** — filtros por status, cliente, transporte e período, **paginado**
  (Anterior/Próxima; o filtro reinicia para a página 1).
- **Central de Agendamento** — definir data + janela, confirmar, reagendar.
- **Cadastros** — clientes (com autorização de transportes), tipos de transporte, itens.
- **Auditoria** — trilha **paginada** com filtros (entidade, ação, período).

> **Paginação:** `/ordens-venda` e `/auditoria` retornam o envelope
> `{ data, page, limit, total, totalPages }`; o cliente (`lib/pagination.ts` +
> `ui/Paginacao`) controla `page`/`limit`. Cadastros não são paginados (cacheados).

> As ações de **escrita** (criar/editar, avançar status, agendar etc.) só
> aparecem para o `OPERADOR` — ver "Autorização por papel" abaixo.

## Autorização por papel (RBAC no cliente)

O `AuthContext` expõe `isOperador` (derivado do `papel` do usuário). O frontend
**espelha** o RBAC do backend: o `AUDITOR` é **somente leitura**.

- Todas as ações de escrita ficam atrás de `{isOperador && …}` — "Nova ordem",
  "Novo/Editar" cadastros, "Transportes", "Avançar status", "Alterar transporte"
  e o formulário de agendamento (o AUDITOR vê só o status, em modo leitura).
- O `Nav` mantém **todos** os links (o AUDITOR lê todas as seções); o cabeçalho
  exibe `AUDITOR · somente leitura`.
- Isso é **UX**, não segurança: a autorização real é do backend. Se um AUDITOR
  forçar uma escrita, a API responde `403` — o gating só evita o caminho morto.

## Sessão: refresh transparente e logout

- **Access token curto** + **refresh token** ficam no `localStorage`.
- Um interceptor de resposta do axios, ao receber `401`, **renova o access**
  via `POST /auth/refresh` (single-flight: 401s concorrentes compartilham uma
  única renovação), **repete** a requisição original e, se a renovação falhar,
  limpa a sessão e redireciona ao login.
- O **logout** chama `POST /auth/logout` (revoga o access via denylist + o
  refresh no servidor) antes de limpar o estado local.

## Error tracking (Sentry)

- `Sentry.ErrorBoundary` (em `main.tsx`) envolve a app: um erro de runtime não
  tratado mostra um **fallback amigável** (`ErroFatal`) em vez de tela branca, e
  é **reportado ao Sentry**.
- **Gated por `VITE_SENTRY_DSN`**: sem o DSN, o Sentry fica desativado (o Error
  Boundary continua funcionando, só não reporta). Em produção, defina
  `VITE_SENTRY_DSN` nas env vars do projeto na Vercel.

## Testes

```bash
npx cypress install      # baixa o binário (postinstall é ignorado pelo pnpm)
pnpm cy:run              # component tests (headless) + cobertura
pnpm cy:open             # modo interativo
pnpm cy:e2e:ci           # e2e (sobe o preview e roda; API mockada via cy.intercept)
```

Cobertura instrumentada com `vite-plugin-istanbul` (ativada por
`CYPRESS_COVERAGE=true`) e coletada por `@cypress/code-coverage` / `nyc`
(relatórios em `coverage/`). Os component tests cobrem componentes-chave e
formulários (validação) e a **divisão por papel** (`RBACGating.cy.tsx`: o
AUDITOR não vê ações de escrita; o OPERADOR vê). O e2e cobre o fluxo de login e
de OVs com a API mockada (`fluxo.cy.ts`) e a divisão de UI por papel contra a
**API real** (`rbac-frontend.cy.ts`).

## Deploy (Vercel)

Root Directory = `frontend`. `vercel.json` define o framework Vite, o output
`dist` e o rewrite catch-all para roteamento client-side. Configure a env
`VITE_API_URL` (origem do backend) em Production/Preview.

```bash
pnpm build               # tsc + vite build → dist/
```

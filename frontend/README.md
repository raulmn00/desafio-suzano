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
| HTTP | axios (instância única, interceptor de Bearer/401) |
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
├── lib/            # env (validado por zod), http (axios + interceptors), queryClient, storage, validators, format
├── auth/           # AuthContext/useAuth, ProtectedRoute, LoginPage
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

- **Login** — formulário validado; persiste token + usuário.
- **Ordens de Venda** — listar/criar (só transportes autorizados do cliente);
  detalhe com avanço de status (apenas a próxima transição válida) e troca de
  transporte.
- **Monitoramento** — filtros por status, cliente, transporte e período.
- **Central de Agendamento** — definir data + janela, confirmar, reagendar.
- **Cadastros** — clientes (com autorização de transportes), tipos de transporte, itens.
- **Auditoria** — trilha com filtros (entidade, ação, período).

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
formulários (validação); o e2e cobre o fluxo de login e de OVs com a API mockada.

## Deploy (Vercel)

Root Directory = `frontend`. `vercel.json` define o framework Vite, o output
`dist` e o rewrite catch-all para roteamento client-side. Configure a env
`VITE_API_URL` (origem do backend) em Production/Preview.

```bash
pnpm build               # tsc + vite build → dist/
```

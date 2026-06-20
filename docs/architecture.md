# OVGS — Arquitetura e Decisões Técnicas

Documento de arquitetura da solução de Gestão de Ordens de Venda. Descreve a
modelagem de domínio, a arquitetura, o fluxo de negócio, os riscos, a estratégia
de auditoria, escalabilidade e segurança — e justifica os trade-offs.

> Este documento parte de uma tese única: **o ciclo de vida da Ordem de Venda é
> uma máquina de estados auditável**. O domínio governa o estado operacional;
> cada transição é uma invariante explícita; e cada mudança relevante é gravada
> de forma imutável na mesma transação. Disso derivam todas as decisões abaixo.

## 1. Modelo de domínio

Modelo orientado a DDD que separa **catálogo** (o que pode ser usado) de
**operação** (a OV e seu ciclo de vida).

```
Cliente ──< autoriza >── TipoTransporte        Item (catálogo, SKU único)
   │                          │                   │
   │ cria                     │ usado por         │ compõe
   ▼                          ▼                   ▼
OrdemDeVenda (aggregate root) ── contém ──> ItemDaOrdem
   │  status (máquina de estados)
   │  agendamento (data + janela + confirmado)
   ▼
AuditEvent (append-only, imutável)  ◀── alimentado por toda mudança de estado
```

| Entidade | Responsabilidade | Atributos-chave |
|---|---|---|
| **Cliente** | Identidade governada + transportes autorizados | `id`, `nome`, `documento` (VO CPF/CNPJ), `transportesAutorizados[]` |
| **TipoTransporte** | Catálogo extensível de modalidades | `id`, `nome`, `codigo` (único) |
| **Item** | Catálogo pré-existente | `id`, `sku` (único), `descricao`, `unidade` |
| **OrdemDeVenda** | *Aggregate root* do ciclo de vida | `id`, `clienteId`, `tipoTransporteId`, `status`, `itens[]`, `agendamento?` |
| **AuditEvent** | Registro imutável de mudança de estado | `ator`, `acao`, `entidade`, `estadoAnterior/Posterior`, `ocorridoEm` |

> **DECISÃO & JUSTIFICATIVA — Separar catálogo de operação.** Tipos de transporte
> e itens são catálogos estáveis; a OV é a entidade viva. Tratá-los como
> agregados distintos evita acoplar regras de ciclo de vida a cadastros e torna
> o catálogo extensível sem tocar nas regras (incluir um novo tipo de transporte
> é inserir uma linha — princípio open/closed).

> **DECISÃO & JUSTIFICATIVA — A autorização de transporte é regra de domínio.** O
> conhecimento "este cliente pode usar este transporte" vive na entidade Cliente
> (`transporteEstaAutorizado`). A criação da OV consulta o agregado Cliente, não
> uma query solta — a regra de negócio mais sensível do desafio fica explícita e
> impossível de contornar.

## 2. Arquitetura proposta

**Monólito modular em Clean Architecture.** Para o porte do problema, o gargalo
não é throughput de domínio nem decomposição de serviços; é a **clareza das
regras de negócio e a rastreabilidade**. Módulos com fronteiras explícitas
(poderiam virar serviços no futuro sem reescrever o domínio), com a regra de
dependência apontando sempre para dentro: `infrastructure → application → domain`.

- **Presentation (infra):** controllers REST, DTOs HTTP (class-validator), guards
  JWT/RBAC, filtro único de exceções.
- **Application:** use-cases (um por operação), *ports* (abstract classes) para
  repositórios e serviços (relógio, id, auditoria, transação).
- **Domain:** entidades, value objects, máquina de estados, erros, interfaces de
  repositório — TypeScript puro, sem framework.

> **DECISÃO & JUSTIFICATIVA — Síncrono e transacional, sem mensageria.** Validar
> invariantes (transporte autorizado, transição válida) exige consistência forte
> e deve ser síncrono. Não há provedor externo lento a reconciliar que
> justifique uma fila; introduzir mensageria adicionaria latência e consistência
> eventual sem benefício proporcional. Mesma linha de raciocínio que rejeita
> microsserviços onde o problema não é de escala distribuída.

## 3. Fluxo de negócio

```
CRIADA ─▶ PLANEJADA ─▶ AGENDADA ─▶ EM_TRANSPORTE ─▶ ENTREGUE
                 │  (exige agendamento confirmado)
```

1. **Criação:** valida cliente, transporte autorizado e existência dos itens;
   nasce em `CRIADA`. Emite `ORDEM_VENDA_CRIADA`.
2. **Planejamento/Agendamento:** define data de entrega + janela; confirma; só
   então pode transicionar para `AGENDADA`. Reagendar volta a OV para "não
   confirmado".
3. **Transporte/Entrega:** avança `EM_TRANSPORTE → ENTREGUE`. Cada transição é
   validada pela máquina de estados e auditada.

> **DECISÃO & JUSTIFICATIVA — `AGENDADA` exige confirmação.** Acoplar a transição
> de status à confirmação do agendamento garante que o estado operacional reflete
> a realidade logística — não se "agenda" sem um agendamento confirmado.

## 4. Principais riscos e mitigações

| Risco | Sev. | Mitigação |
|---|---|---|
| Transição de estado inválida corromper o fluxo | Alta | Máquina de estados como única fonte de verdade; transições inválidas rejeitadas e testadas (matriz completa) |
| OV criada com transporte não autorizado | Alta | Regra no domínio (`transporteEstaAutorizado`), revalidada também na troca de transporte |
| Perda de rastreabilidade | Alta | Auditoria append-only gravada na mesma transação (outbox); estado antes/depois |
| Inconsistência parcial em operações multi-tabela | Média | `TransactionManager` + `AsyncLocalStorage`: repositório + auditoria atômicos |
| Esgotamento de conexões sob pico (serverless) | Média | Neon pooled (PgBouncer) + `connection_limit` baixo |
| Acesso indevido / escalonamento | Média | JWT + RBAC (OPERADOR/AUDITOR), autorização sempre no backend |

## 5. Estratégia de auditoria

A auditoria é um **registro de negócio imutável**, não um log de aplicação.
Responde, para cada operação relevante: quem fez, o quê, quando, sobre qual alvo,
e qual era o estado antes e depois.

> **DECISÃO & JUSTIFICATIVA — Outbox em vez de "logar depois".** Gravar o
> `AuditEvent` na mesma transação da mudança de estado elimina a janela em que a
> operação ocorre mas o evento se perde. O `AuditLogger` (port) é implementado
> sobre o client transacional propagado via `AsyncLocalStorage`.

## 6. Escalabilidade

- Core stateless → escala horizontal (instâncias da Cloud Run).
- Índices alinhados aos filtros de monitoramento e às consultas de auditoria.
- Auditoria (tabela que mais cresce) → candidata a particionamento por tempo e
  arquivamento; leituras pesadas podem ir para read replicas sem tocar o domínio.

## 7. Segurança

- Autenticação JWT; senhas com bcrypt; **autorização sempre no backend**.
- RBAC com papéis distintos (operador/auditor) e *least privilege*.
- Validação de entrada na borda (class-validator) e de invariantes no domínio.
- Segredos via variáveis de ambiente / secret manager no deploy (nunca em código).

---

> **Fio condutor da solução.** Todas as decisões partem de uma tese única: a OV é
> uma **máquina de estados auditável**, cujo domínio governa o estado operacional
> de forma síncrona e transacional. Disso derivam a separação catálogo/operação
> (§1), o monólito modular sem mensageria (§2), a máquina de estados com
> invariantes explícitas (§3) e a auditoria imutável via outbox (§5).

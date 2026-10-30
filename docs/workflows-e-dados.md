# Workflows, automações e dados

## 1. Gatilhos

| Tipo | Quando dispara | Observações |
|---|---|---|
| `scheduled` | cron, intervalo fixo ou instante único | fuso do workspace |
| `entity` | criação / atualização / exclusão de registro | por entidade |
| `connector` | evento em tempo real do provedor | exige `condition` em jq |
| `webhook` | POST em URL de webhook do workspace | para provedores sem connector trigger |

Regra prática: **evento real → gatilho**. Polling agendado é o último recurso.

### Condição em jq (obrigatória em connector triggers)

```text
${ (.trigger.data.repository.full_name | ascii_downcase) == "owner/repo" }
```

Sem a condição, um gatilho de repositório dispara para todos os repositórios observados.

## 2. Atividades de um step

| Atividade | Papel |
|---|---|
| `compute_seconds_until` | calcula segundos até um instante (para `wait` dinâmico) |
| `invoke_backend_function` | roda código próprio, sem LLM |
| `invoke_superagent_step` | turno de LLM (julgamento, composição, entrega ao usuário) |

## 3. Tipos de step

- `call` — atividade + `then`
- `wait` — pausa durável ISO-8601, sobrevive a restart
- `switch` — ramificação por condições jq, com `catch-all ${ true }`

## 4. Entidades

- Schema JSON por entidade; campos automáticos `id`, `created_date`, `updated_date`, `created_by`.
- `User` é especial: mantém `email`, `full_name`, `role`.
- **RLS**: quando ligado, o usuário não-admin só vê o que criou; admin vê tudo.
- Paginação: `skip` + `limit` (o tool) ou cursor (`page.items`, `page.next_cursor`) no SDK.
- Filtros: `{ status: "active" }`, comparações `{ amount: { $gte: 10 } }`.

## 5. Boas práticas de automação

1. Idempotência: um evento repetido não deve duplicar efeito.
2. Escopo mínimo no gatilho: quanto mais estreita a condição, menos crédito queimado.
3. Backend function só para API externa — nunca para chamar LLM.
4. Workflows destrutivos: codificar as proteções **na definição**, não na conversa.
5. Logs: um run por execução, com o definition version usada.

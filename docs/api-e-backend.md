# Backend e API da plataforma

Mapa da superfície de backend do Superagente, montado a partir da documentação oficial
(`docs.base44.com`, outubro de 2026). É descritivo: nenhum código da plataforma foi copiado.
Serve para entender o que a interface consome e o que a demonstração deste repositório imita
localmente.

## 1. Autenticação

- Chamadas de API aceitam **chave pessoal** (`Authorization: Bearer <token>`) e, em alguns
  casos, chave de workspace.
- Cada endpoint documenta quem pode chamar: dono do agente, pessoas com acesso ao app, ou
  somente leitura. Exemplo: `agent-configs/usage` aceita chave pessoal, inclusive de leitura,
  mas **não** aceita chave de workspace.
- A interface web usa sessão do usuário; o SDK do app usa `createClient` com o usuário da
  requisição ou `asServiceRole` dentro de funções de backend autorizadas.

## 2. Entidades (dados do app)

Base: `/api/apps/{app_id}/entities/{entity_name}`

| Operação | Método e caminho |
|---|---|
| Criar um | `POST /entities/{entity_name}` |
| Criar vários | `POST /entities/{entity_name}/bulk` |
| Listar | `GET /entities/{entity_name}` |
| Obter um | `GET /entities/{entity_name}/{record_id}` |
| Atualizar um | `PATCH /entities/{entity_name}/{record_id}` |
| Atualizar por filtro | `PATCH /entities/{entity_name}` |
| Upsert | `POST /entities/{entity_name}/upsert` |
| Excluir um | `DELETE /entities/{entity_name}/{record_id}` |
| Excluir por filtro | `DELETE /entities/{entity_name}` |
| Restaurar | `POST /entities/{entity_name}/restore` |
| Contar | `GET /entities/{entity_name}/count` |
| Agregar | `GET /entities/{entity_name}/aggregate` |
| Importar CSV | `POST /entities/{entity_name}/import` |

Regras observadas na documentação:

- Campos desconhecidos são **ignorados**, não geram erro.
- `id`, `created_date`, `updated_date`, `created_by` e `created_by_id` são sempre gerados
  pelo servidor e ignorados se enviados.
- RLS vale na API: a chamada falha se a regra da entidade não cobrir o registro.
- Criar registro dispara webhooks e automações/workflows que escutam aquela entidade.

Esquemas: `GET/POST/PATCH/DELETE /entities/schemas` mais `sync` para reconciliar schemas.

## 3. Superagent

Base: `/api/agents/{agent_id}`

| Operação | Método e caminho |
|---|---|
| Criar agente | `POST /api/agents` |
| Listar agentes do app | `GET /api/agents` |
| Listar agentes do usuário | `GET /api/agents/mine` |
| Criar ou obter conversa | `POST /conversations` |
| Listar conversas | `GET /conversations` |
| Obter conversa | `GET /conversations/{conversation_id}` |
| Enviar mensagem | `POST /conversations/{conversation_id}/messages` |
| Excluir mensagem | `DELETE /conversations/{conversation_id}/messages/{message_id}` |
| Listar memórias | `GET /memory` |
| Excluir memória | `DELETE /memory/{memory_id}` |
| Criar webhook | `POST /webhooks` |
| Listar webhooks | `GET /webhooks` |
| Atualizar webhook | `PATCH /webhooks/{webhook_id}` |
| Testar webhook | `POST /webhooks/{webhook_id}/test` |
| Excluir webhook | `DELETE /webhooks/{webhook_id}` |
| Uso de créditos por agente | `GET /api/apps/{app_id}/agent-configs/usage` |

Comportamentos relevantes:

- **Uma conversa principal por usuário e agente.** Chamar `POST /conversations` de novo
  devolve a mesma conversa; `metadata` só é gravada na criação.
- **Envio de mensagem é síncrono.** A requisição fica aberta enquanto o agente trabalha,
  incluindo as ferramentas que ele chamar, e devolve a resposta final. Respostas com muitas
  ferramentas podem levar minutos: use timeout generoso.
- O corpo aceita `content` e `file_urls`.
- O turno consome créditos do workspace do agente.

## 4. Webhooks de saída

- Eventos: `message.created` (mensagem adicionada) e `message.completed` (agente terminou).
- `target_url` precisa ser **HTTPS público**.
- Limite: até **5 webhooks por agente**, e cada `POST` cria um novo. Antes de repetir uma
  criação que talvez tenha funcionado, liste os webhooks.
- Entrega **única, sem retentativa**; falha é registrada e não reenviada.

## 5. Conectores

- OAuth por provedor, com escopo declarado e estado "Active" na interface.
- Exemplo observado na própria UI: `Gmail — Active · Read only`.
- Conectores pertencem ao workspace; o agente só usa o que estiver autorizado.
- Ações que mudam algo fora da plataforma podem exigir confirmação do dono (guardas de
  aprovação e bloqueio de pagamentos).

## 6. Créditos

Dois tipos, com contabilidades separadas:

| Tipo | Quando é consumido |
|---|---|
| Créditos de mensagem | Interação com a IA na construção do app |
| Créditos de integração | Serviços embutidos: e-mail, imagem, LLM, agentes internos, invocação de função |

- Não existe valor fixo por mensagem: o custo varia com o trabalho executado.
- Chamadas a serviço externo com a sua própria chave não consomem crédito de integração.
- Existe limite por minuto (ex.: `agent-configs/usage` documenta 60 req/min por app,
  compartilhado entre as chaves pessoais do workspace).

## 7. Como a demonstração deste repositório se relaciona com isso

A interface em `index.html` não chama a API real: ela mantém o estado em `localStorage` e
imita os contratos acima.

| Contrato real | Imitação local |
|---|---|
| `POST /conversations/{id}/messages` síncrono | `sendMessage()` com atraso e streaming simulado |
| Créditos por turno | `state.agent.credits` + mural de bloqueio quando zera |
| `message.created` / `message.completed` | toasts e re-render após a resposta |
| Entidades e registros | view `Dados`, com campos por schema |
| Memória com `GET/DELETE /memory` | view `Memória`, com categorias |
| Webhooks (5 por agente) | referência na aba Desenvolvedor das configurações |

## 8. O que não está documentado publicamente

- Formato exato do stream token a token da interface web (a API pública devolve a resposta
  completa, não SSE).
- Esquema interno das tabelas de conversa e a política de retenção de histórico.
- Limites de tamanho por mensagem e por anexo.

Nesses pontos, este repositório não inventa: apenas descreve o comportamento observável.

## 9. URLs consultadas

- https://docs.base44.com/llms.txt
- https://docs.base44.com/Account-and-billing/Credits.md
- https://docs.base44.com/api-reference/create-entity-record.md
- https://docs.base44.com/api-reference/create-superagent-conversation.md
- https://docs.base44.com/api-reference/send-superagent-message.md
- https://docs.base44.com/api-reference/create-superagent-webhook.md
- https://docs.base44.com/api-reference/get-agent-usage.md
- https://docs.base44.com/developers/references/sdk/overview.md

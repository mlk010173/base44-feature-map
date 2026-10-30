# Sistema visual observado na interface padrão

Registro das decisões visuais da interface padrão do Superagente, observadas em sessão
autenticada (outubro de 2026), e como cada uma foi traduzida na implementação deste
repositório. Serve como referência de design, não como cópia de código.

## 1. Estrutura de página

| Região | Largura / altura observada | Comportamento |
|---|---|---|
| Sidebar | ~250 px, fixa | Rolagem própria; rodapé (onboarding, plano, usuário) sempre visível |
| Barra superior | ~52 px | Nome do agente à esquerda, ação de upgrade à direita |
| Área de conteúdo | fluida, centralizada em ~760 px no chat | Página inteira rola; chat tem rolagem própria |
| Compositor | fixo no rodapé do chat | Cresce em altura até ~200 px |

## 2. Paleta

| Papel | Claro | Escuro | Uso |
|---|---|---|---|
| Fundo | `#ffffff` | `#101114` | Área de conteúdo |
| Sidebar | `#f8f8f9` | `#17181c` | Coluna de navegação |
| Borda | `#e8e8ea` | `#2a2e36` | Divisórias de 1 px |
| Texto | `#16181c` | `#f1f2f4` | Títulos e corpo |
| Texto secundário | `#6f7480` | `#9aa0aa` | Descrições e metadados |
| Azul de ação | `#2563eb` | `#6b93ff` | Item ativo, aba, botão primário |
| Laranja comercial | `#f97316` | `#fb923c` | Upgrade, mural de créditos |
| Verde de sucesso | `#0f9d63` | `#4ad19a` | Status ativo, execução ok |
| Vermelho | `#dc2626` | `#f47777` | Erro, desconectar, exclusão |

Regra que a interface segue: **azul conduz a navegação e a ação principal; laranja é
reservado para dinheiro** (plano, créditos, upgrade). Nunca se misturam no mesmo bloco.

## 3. Tipografia

- Família sem serifa geométrica (Inter ou equivalente), `-webkit-font-smoothing: antialiased`.
- Escala observada: 11 px (rótulos de seção, maiúsculas com `letter-spacing`), 12 a 12,5 px
  (metadados, itens de sidebar), 13 a 13,5 px (corpo de listas e formulários), 14,5 px
  (mensagens do chat), 20 a 22 px (título de página e saudação).
- Peso: 400 no corpo, 550 a 600 em rótulos e nomes, 650 em títulos.
- Números e identificadores usam monoespaçada.

## 4. Componentes

**Alternador Apps/Agente**: pílula com fundo neutro; a opção ativa ganha fundo branco,
texto azul e anel azul de 1 px.

**Item de navegação**: altura de 28 a 30 px, ícone de 16 px, raio de 7 px. O estado ativo
é um fundo cinza claro, não azul. Ícones ficam neutros mesmo quando o item está ativo.

**Cartão**: fundo branco, borda de 1 px, raio de 12 px, sem sombra em repouso. A sombra
aparece só em sobreposição (modal, toast, paleta).

**Tabela**: cabeçalho com fundo levíssimo cinza, texto em 11 px maiúsculo, linhas separadas
por borda inferior de 1 px. Ações alinhadas à direita, em botões pequenos.

**Abas**: sublinhado azul de 2 px deslocado 1 px para baixo da borda do contêiner.

**Mural de créditos**: fundo creme (`#fdf3ea`), borda tracejada, linha superior com
"0 créditos restantes" à esquerda e a data de renovação à direita, texto explicativo e um
único botão laranja. O compositor fica desabilitado enquanto o mural está visível.

**Compositor**: raio de 18 px, borda de 1 px, anel azul suave ao receber foco. Dentro dele:
anexo, seletor de modelo, microfone, onda de voz e envio. O envio é um botão pílula azul.

**Passos de ferramenta**: pílulas pequenas em monoespaçada, com ponto de status
(cinza parado, azul pulsando em execução, verde concluído).

**Indicador de raciocínio**: não é texto "Thinking..."; é um quadradinho arredondado com o
ícone do agente pulsando. Texto só aparece em leitores de tela (`aria-label`).

## 5. Estados de tela

- **Vazio de conversa**: marca do agente, saudação com o primeiro nome, pergunta curta e
  três sugestões clicáveis com título e descrição.
- **Sem créditos**: mural acima do compositor, entrada desabilitada em todos os campos.
- **Carregando**: indicador pulsante, sem esqueleto de conteúdo.
- **Sem permissão**: mensagem neutra, sem detalhes técnicos.
- **Lista vazia**: caixa tracejada com título, uma frase e a ação principal.

## 6. O que este repositório faz diferente (de propósito)

- Marca, textos e ícones próprios: nada de logo, asset ou string do produto original.
- Paleta equivalente em papel, não em hex copiado linha a linha.
- Tema escuro completo, que a interface original também oferece.
- Atalhos de teclado, `aria-live` no streaming e respeito a `prefers-reduced-motion`.

## 7. Medidas usadas nesta implementação

```css
--sidebar: 250px;      /* coluna de navegação */
--rail: 52px;          /* barra superior */
.chat-inner { max-width: 760px; }
.view-inner { max-width: 920px; }
.composer  { border-radius: 18px; }
.card,.row,.note { border-radius: 12px; }
.nav-item  { padding: 6px 8px; border-radius: 7px; font-size: 13px; }
```

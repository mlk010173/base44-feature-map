# Tokens da interface: medidos no site público

Método: os valores abaixo foram lidos do CSS que o site público serve hoje (30/10/2026), nos
arquivos `app`, `_index` e `startup` do domínio `base44.com`. É leitura de valores, não cópia: o
projeto aqui declara os próprios nomes e a própria paleta, e nenhuma folha de estilo do original
foi incorporada.

## 1. Tema claro — valores publicados

| Token publicado | Valor | Hex aproximado | Papel |
|---|---|---|---|
| `background` | `hsl(40 20% 97%)` | `#f9f8f6` | fundo quente, quase branco |
| `card` | `hsl(0 0% 100%)` | `#ffffff` | superfície elevada |
| `foreground` | `hsl(0 0% 6%)` | `#0f0f0f` | texto principal |
| `secondary` | `hsl(36 20% 94%)` | `#f3f0ed` | superfície secundária |
| `muted-foreground` | `hsl(220 8% 15%)` | `#232529` | texto de apoio |
| `border` / `input` | `hsl(36 12% 83%)` | `#d9d5ce` | contorno neutro |
| `brand` | `hsl(28 96% 61%)` | `#fb953c` | laranja da marca |
| `brand-hover` | `hsl(28 82% 55%)` | `#ea862e` | laranja em hover |
| `sidebar-background` | `hsl(0 0% 98%)` | `#fafafa` | coluna de navegação |
| `radius` | `.75rem` | `12px` | raio base de cartões |

Observação de arquitetura: os tokens são triplas HSL sem `hsl()` (`--primary: 0 0% 6%`), o que
permite compor `hsl(var(--primary) / .5)` para opacidade sem gerar nova cor.

## 2. Tema escuro — valores publicados

| Token publicado | Valor | Hex aproximado |
|---|---|---|
| `background` / `card` | `hsl(240 10% 3.9%)` | `#09090b` |
| `foreground` | `hsl(0 0% 98%)` | `#fafafa` |
| `secondary` / `border` | `hsl(240 3.7% 15.9%)` | `#27272a` |
| `muted-foreground` | `hsl(240 5% 64.9%)` | `#a1a1aa` |
| `sidebar-background` | `hsl(240 5.9% 10%)` | `#18181b` |

## 3. Lógica que vale replicar (o conceito, não o arquivo)

1. **Dois níveis de superfície.** Fundo quente + cartão branco puro. A diferença é pequena e é o
   que dá a sensação de foco sem sombra pesada.
2. **Acento único.** Um laranja de marca reservado a ação e a crédito; tudo o mais é neutro.
   Quando o acento aparece, ele significa algo.
3. **Raio de 12 px no cartão, 6 a 8 px em chip e botão.** Escala curta, sem raios aleatórios.
4. **Tripla HSL em vez de hex** para permitir composição de opacidade.
5. **Dark mode por inversão de variáveis**, não por filtro: as mesmas classes funcionam nos dois temas.

## 4. Tipografia

| Publicado | Uso observado | Situação |
|---|---|---|
| `WixMadeforText` | interface do app | fonte licenciada, variável 100–900 |
| `Dazzed` | títulos do site de marketing | fonte licenciada |
| `Geist` | texto do site de marketing | open source |

Nada disso é redistribuível aqui. Este projeto usa **Inter** (open source, SIL OFL) com pesos
400 a 700, e `ui-monospace` para valores técnicos. O tamanho de texto segue os mesmos degraus
observados na interface padrão (11, 12, 12.5, 13.5 e 22 px), mas a escolha de cada degrau é
daqui.

## 5. Movimento

Nenhuma animação foi extraída do original. As transições do projeto são próprias e curtas, para
não pesar em página estática:

| Situação | Duração | Curva |
|---|---|---|
| hover de item de navegação, chip, botão | 120 ms | `ease` |
| troca de tema, abertura de aba | 150 ms | `ease` |
| barra de progresso | 300 ms | `ease` |
| entrada de toast | 160 ms | `ease-out` |

Padrões observados e reproduzidos como **conceito**: indicador de "pensando" com três pontos
defasados, cursor piscando no fim do texto em streaming, e cartão de ferramenta que colapsa de
"executando" para "concluído" preservando o resumo.

## 6. Mapa entre os dois sistemas

| Conceito | Token publicado | Token usado aqui |
|---|---|---|
| fundo | `--background` | `--bg` |
| superfície elevada | `--card` | `--panel` |
| superfície secundária | `--secondary` | `--panel-2` |
| contorno | `--border` | `--line` |
| texto | `--foreground` | `--text` |
| texto de apoio | `--muted-foreground` | `--muted` |
| acento de ação | `--brand` (laranja) | `--blue` (azul), com `--orange` só em crédito |
| raio base | `--radius: .75rem` | `--radius: 12px` |

A divergência deliberada é a cor de ação: aqui o azul conduz navegação e ação, e o laranja fica
reservado ao que é crédito ou aviso. Isso evita a leitura errada de que o botão principal é uma
promoção.

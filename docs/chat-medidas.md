# Medidas e comportamento do chat

Especificação do que foi construído aqui: medidas em pixels, estados e regras de interação. Serve
para evoluir a interface sem ter que reler o JavaScript. Nada é transcrição de folha de estilo
alheia; as medidas são escolhas próprias, calibradas pela observação registrada em
[`interface-visual.md`](interface-visual.md).

## 1. Grade da tela

| Elemento | Medida |
|---|---|
| coluna de navegação | 250 px, borda de 1 px à direita, rodapé fixo |
| barra superior | 52 px, título 13,5 px com peso 600 |
| coluna de leitura do chat | 760 px centralizados, margem lateral mínima de 16 px |
| espaçamento entre mensagens | 18 px |
| compositor | largura da coluna, raio 18 px, borda de 1 px |
| altura máxima do campo | 180 px, depois rola |

## 2. Escala de texto

| Uso | Tamanho / peso |
|---|---|
| título de seção | 15 px / 650 |
| corpo de mensagem | 13,5 px / 400, altura de linha 1,6 |
| apoio e legenda | 12 px / 400, cor `--muted` |
| rótulo técnico | 11 px / 600, monoespaçada |
| número grande | 22 px / 700 |

## 3. Anatomia da mensagem

Cabeçalho com avatar de 20 px, nome em 12 px peso 600 e hora em 11 px. Abaixo, opcionalmente, a
lista de passos de ferramenta; cada passo tem ponto de 6 px, nome monoespaçado e resumo do
resultado. Depois o corpo.

**Ações da mensagem** aparecem em hover ou foco (`opacity 0 → 1` em 120 ms):

- `copiar`: escreve o texto no clipboard; sem HTTPS avisa em vez de falhar calado;
- `editar` (só na mensagem do usuário): devolve o texto ao compositor com o cursor no fim;
- `gerar de novo` (só na mensagem do agente): remove a resposta e refaz o streaming a partir da
  última mensagem do usuário; consome um crédito e fica bloqueado durante um streaming ativo.

## 4. Compositor

Ordem interna: trilha de anexos, campo, barra de ações. A barra tem anexo, seletor de modelo
(Auto, Rápido, Avançado, Raciocínio), ditado, modo voz e enviar. Durante o streaming o botão muda
de rótulo para **Parar** e passa a interromper em vez de enviar.

- `Enter` envia, `Shift + Enter` quebra linha.
- `Esc` fecha paleta, depois modal.
- `⌘K` / `Ctrl + K` abre a busca rápida.
- Digitar `/` abre a lista de comandos com filtro incremental; clicar preenche o campo.
- Anexo aceita vários arquivos, aparece como pílula removível acima do campo, entra em Arquivos e
  é anexado à mensagem enviada.

## 5. Busca rápida (⌘K)

Sobreposição centralizada com 560 px, topo em 14 vh, raio 14 px, lista com altura máxima de 380 px.
Agrupa quatro origens: telas, conversas, comandos (`/goal`, `/workflow`, `/note`, `/memory`) e
habilidades do catálogo. Navegação por setas, `Enter` abre, `Esc` fecha, clique no fundo fecha.

## 6. Estados do chat

| Estado | O que aparece |
|---|---|
| vazio | saudação, três sugestões com ícone e legenda |
| pensando | indicador com três pontos defasados, `aria-live` |
| ferramenta em execução | passo com ponto pulsante; ao concluir vira resumo com duração |
| streaming | texto crescendo com cursor de 2 px piscando |
| interrompido | texto parcial preservado com marca de interrupção |
| sem crédito | campo desabilitado, aviso e botão de planos |

## 7. Acessibilidade

- foco visível em todos os controles interativos;
- `aria-label` em ícones sem texto e `aria-live` no indicador de pensamento;
- contraste mínimo de 4,5:1 no texto de corpo nos dois temas;
- nenhuma informação transmitida só por cor: estado de ferramenta também tem palavra.

## 8. Movimento

| Situação | Duração |
|---|---|
| hover de item, chip e botão | 120 ms |
| abertura de paleta e toast | 120 a 160 ms |
| troca de tema | 150 ms |
| cursor de streaming | 1 s em dois passos |

Respeita `prefers-reduced-motion`, que zera durações de animação.

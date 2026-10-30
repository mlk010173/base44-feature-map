# Roadmap — o que dá para melhorar

Ideias priorizadas para evoluir este mapa e a interface do site. Nada aqui é cópia de produto.

## Curto prazo

1. **Fechar o mapa de rotas internas.** Fazer o login funcionar (senha correta ou OAuth Google) e
   percorrer: chat, channels, plugins, workflows, notes, files, memory, data, agent settings.
   Registrar URL, título e elementos-chave de cada tela.
2. **Catálogo de estados vazios e de erro** de cada área — o que mais dói em onboarding.
3. **Índice de connectors com escopos mínimos** necessários por caso de uso.

## Médio prazo

4. **Comparador de canais**: tabela de recursos suportados (áudio, imagem, arquivo, grupo, reação)
   por WhatsApp, Telegram, iMessage, Slack, LINE e Phone.
5. **Receitas de workflow**: modelos prontos (briefing matinal, triagem de inbox, resumo semanal,
   monitor de repositório) com o JSON do definition ao lado.
6. **Mapa de créditos**: o que consome crédito, o que é grátis, quanto custa cada tipo de step.
7. **Design system próprio**: tokens de cor, tipografia, densidade — sem herdar nada do original.

## Longo prazo

8. **Explorador interativo** do mapa (grafo de áreas → recursos → ferramentas), gerado a partir de YAML.
9. **Versão em português e inglês** gerada do mesmo dataset.
10. **Acessibilidade auditada** (WCAG AA) na interface do site.

## Fora de escopo (por decisão do pedido)

- Reimplementar o Superagent de IA, o motor de streaming ou o runtime de ferramentas.
- Copiar código, assets, textos ou CSS do produto original.
- Qualquer engenharia reversa de lógica proprietária.

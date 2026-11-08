# OracleMSCW / Maple Atlas

Consulta de monstros do MapleStory Classic World com mapas reais do OSMS Data Explorer e rotas sugeridas por IA. Frontend pronto para GitHub Pages, backend separado para proteger a chave de IA. Projeto independente, sem afiliação à NEXON, OSMS ou Minerva.

## Rodar localmente

Requisitos: Node 22+ e Python 3. Sem dependências no frontend.

```sh
python scripts/refresh-data.py
npm test
npm run preview
```

Abra http://localhost:4173. A busca, o ranking e os spawns funcionam sem a API; a rota não é simulada quando a IA não está configurada. A lista inicial ordena quantidade/proporção de alvos; não mede eficiência real, não calcula hit chance e não confirma drops.

## API de IA

1. Crie um Cloudflare Worker com `api/wrangler.jsonc` (Wrangler).
2. Configure `OPENAI_MODEL` com um modelo disponível na sua conta que aceite visão e Structured Outputs. Está vazio intencionalmente até definição do responsável.
3. Configure `ALLOWED_ORIGINS` com a origem exata do Pages, em minúsculas, sem path. Mantenha localhost apenas durante desenvolvimento.
4. Defina `OPENAI_API_KEY` como secret com `wrangler secret put OPENAI_API_KEY --config api/wrangler.jsonc`. Nunca coloque chaves em código, GitHub Pages ou chat.
5. Publique a API com `wrangler deploy --config api/wrangler.jsonc`.
6. Em `site/config.js`, defina `API_BASE` com a URL HTTPS do Worker para todos os visitantes. Para teste individual, use o painel “Conexão da IA”, salvo apenas no navegador.

O backend consulta os dados reais do monstro/mapa, envia a imagem original à Responses API e pede etapas com coordenadas normalizadas. O frontend desenha SVG sobre a imagem, sem modificar terreno. Validações verificam schema, limites de coordenadas e mapa; não provam navegabilidade física. Rotas são sugestões e podem ser recusadas pela IA quando a imagem não permite um trajeto confiável.

Cada análise consome a API de IA do responsável. O Worker exige binding de rate limit (5 consultas/minuto por IP); CORS não é autenticação e o limite não é teto global de gastos. Antes de uso público amplo, configure limites de orçamento na conta e proteção/autenticação apropriada ao público. Não há chamadas reais de IA nos testes.

## GitHub Pages

Integre estes arquivos ao repositório após revisar seu conteúdo existente. Em Settings → Pages, selecione GitHub Actions. O workflow publica somente `site/`; `api/` não é executado no Pages. O branch está configurado como `main`; ajuste se o repositório usar outro.

Pages em repositórios privados depende do plano. Hospedar o código em repositório privado não garante que a página publicada seja privada. Não altere a visibilidade do repositório apenas para habilitar Pages sem decisão do proprietário.

## Dados e créditos

Fonte: https://osmsdataexplorer.com/ — repositório https://github.com/ohmi69/osms_datamine_dashboard. Os arquivos de dados de fallback incluem data de obtenção e origem em `site/data/source.json`. Arte dos mapas e monstros © NEXON. Não há licença própria sobre esses recursos; mantenha avisos e revise os termos da fonte antes de redistribuição pública. O aplicativo solicita a arte original diretamente ao OSMS.

Documentação da integração:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

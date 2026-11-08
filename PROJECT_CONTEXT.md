# OracleMSCW — contexto deste chat

## Objetivo aceito
Site no repositório privado https://github.com/henriqueLD/OracleMSCW, hospedado no GitHub Pages. Usuário escolhe monstro, classe, nível e accuracy; recebe mapas e rota sobre mapa real. Análise por IA em API separada foi confirmada em 08/11/2026.

## Preferências e fonte
- Português brasileiro; experiência prática, clara e útil durante o jogo, inclusive monitor ultrawide.
- OSMS Data Explorer, mesma fonte usada por Minerva v0.17.0. Fonte é pública e não precisa executar Minerva.
- Não confundir variantes de mobs. Dados de spawn não comprovam drops ou abates/hora.
- Perfil recente de exemplo: Assassin 33 com 100% de acerto informado; isso não comprova hit kill.
- Exemplos anteriores: Stump comum para Tree Branch/Bronze Ore; Ribbon Pig em L Forest I para Leather.
- Rotas devem preservar geometria real. Nesta aplicação, SVG sobre imagem original evita alteração da arte por geração de imagem.

## Implementação
- site/: aplicação estática sem build, dados ao vivo com fallback datado, comparação de mapas, spawns e sobreposição SVG.
- api/: Cloudflare Worker com análise visual pela OpenAI Responses API; chave só no servidor, origem restrita e limite de consultas.
- tests/: verificações de ranking, validação e integração simulada da API.
- .github/workflows/pages.yml: publicação do diretório site no Pages.

## Pendências externas
- Confirmar acesso autenticado ao repositório privado e inspecionar conteúdo/AGENTS antes de integrar; não sobrescrever arquivos existentes.
- Escolher/configurar Cloudflare, OPENAI_API_KEY, OPENAI_MODEL e URL da API no frontend.
- Configurar GitHub Pages. Repositório privado pode depender do plano da conta; não torná-lo público sem solicitação.
- Registrar pasta como projeto e mover chat na interface do Codex: ferramenta disponível só move para projetos já existentes.

Esta nota é um resumo operacional, não exportação integral do chat e não comprova publicação.

## Validação em 08/11/2026 — continuação
- PROJECT_CONTEXT.md lido antes de prosseguir.
- Conexão GitHub: GET de henriqueLD/OracleMSCW e de seu conteúdo retornaram 404 (NOT_FOUND). Busca nas instalações conectadas por OracleMSCW retornou lista vazia. Acesso autenticado ainda não comprovado; isso não comprova inexistência do repositório privado.
- Pasta local não possui repositório Git próprio; nenhum remote ou histórico foi criado para evitar integrar sem inspecionar o destino.
- npm test executado: 6 testes aprovados, 0 falhas; integração da IA simulada, sem consumo da API paga.
- Integração remota permanece pendente de disponibilizar henriqueLD/OracleMSCW à conexão GitHub deste chat e confirmar o nome exato. Após acesso, ler conteúdo e AGENTS.md remotos antes de combinar arquivos.
- Nenhum push, publicação ou alteração de visibilidade realizado. API_BASE e OPENAI_MODEL continuam vazios.

## Acesso liberado em 08/11/2026
- Nova consulta autenticada confirmou henriqueLD/OracleMSCW privado, branch padrão main e permissões de leitura/escrita.
- Árvore remota inspecionada: apenas README.md com o título OracleMSCW; nenhum AGENTS.md remoto.
- Integração preparada em branch codex/integrate-maple-atlas, preservando README.md remoto. A documentação local README.md será incluída como docs/SETUP.md.
- Seis testes aprovados novamente. Configuração de Cloudflare, modelo, chave e endpoint continua pendente; nenhuma publicação foi realizada.

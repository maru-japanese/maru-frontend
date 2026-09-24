# Arquitetura do Maru

O produto começa com uma trilha para quem ainda não conhece japonês. Conteúdo
didático, regras de aprendizado, infraestrutura e interface são separados.
JavaScript nativo e CSS dão conta da aplicação sem compilação de código. Este
repositório contém a interface e as regras executadas no navegador; serviços,
credenciais e persistência vivem no repositório `maru-backend`.

## Fronteiras

| Camada | Responsabilidade |
| --- | --- |
| `shared/lessons/` | Texto das lições, exemplos, objetivos e perguntas. |
| `shared/curriculum.js` | Ordem das oito etapas, índice de lições e referências. |
| `shared/catalog.js` | Combinações, kanji iniciais, partículas, expressões e frases. |
| `shared/vocabulary.js`, `glossary.js`, `exercises.js` | Vocabulário inicial, conceitos e perguntas por tipo. |
| `shared/pronunciation.js` | Texto e leitura correta das pronúncias aceitas pela API. |
| `shared/placement.js`, `learningPath.js` | Diagnóstico por etapa, ponto de entrada e selos de conclusão. |
| `shared/discovery.js` | Cápsulas culturais e trilhas temáticas por referências ao acervo. |
| `maru-backend/supabase/functions/maru-api/` | API de produção, sessões Supabase Auth e progresso no Postgres. |
| `shared/gamification.js` | Níveis, missões e conquistas derivados do progresso. |
| `shared/content.js` | Kana básicos e acervo complementar preservado. |
| `shared/progress.js` | Normalização, migração, mesclagem, XP, constância e revisão. |
| `shared/sentenceCheck.js` | Verificação de exercícios conhecidos, reutilizada offline. |
| `shared/romaji.js` | Leitura de kana e comparação em diferentes grafias. |
| `maru-backend/backend/` | Serviços reutilizados e adaptador Node/SQLite local. |
| `frontend/assets/js/core/` | Estado persistido, áudio, ícones e helpers de UI. |
| `frontend/assets/js/features/` | Telas e controladores de cada atividade. |
| `frontend/assets/css/` | Sistema visual, layout, componentes e responsividade. |

Conteúdo e domínio compartilhados não dependem de DOM nem do servidor. As telas
chamam as regras de domínio sem reimplementar XP, migração ou revisão.

## Inicialização e navegação

1. O build copia `frontend/` e `shared/` para `dist/`, publicado na Vercel.
2. Em produção, `/api` é encaminhado à função Supabase; localmente, ao adaptador Node.
3. O HTML carrega o agregador de CSS e o módulo `app.js`.
4. O store lê o estado local, migra dados antigos e mescla o snapshot da API.
5. O app monta o shell e escolhe a tela pela URL, como `#/lesson/welcome`.
6. Cada tela renderiza em main e devolve um cleanup para eventos e recursos.
7. Ao navegar, o app limpa os recursos, interrompe o áudio e foca o título.

Histórico, links diretos e recarga funcionam com rotas por hash. O shell fica
montado entre telas. Alterações de progresso atualizam seus contadores sem
reconstruir uma atividade em andamento. Na navegação móvel, as regiões
inativas recebem inert; foco e Escape são tratados pelo shell.

A barra lateral contém cinco destinos: Início, Minha trilha, Praticar, Revisão
e Explorar. core/navigation.js centraliza os destinos, os recursos e a relação
de cada tela com sua seção. Essa relação mantém o destaque do menu e o link de
retorno no cabeçalho, inclusive ao abrir uma URL diretamente. O seletor de tema
e Meu ritmo ficam no rodapé da barra, separados da navegação de estudo.

Praticar reúne exercícios/escuta, escrita e frases. Explorar organiza as consultas
por fundamentos, cultura e materiais de apoio, com busca sem distinção de acentos.
Os filtros são guardados por aba em sessionStorage; voltar de um material restaura
a busca. Nenhuma rota de conteúdo foi removida.

## Telas

- Dashboard: próximo passo, meta diária e acesso às práticas.
- Journey: etapas expansíveis e estado de cada lição.
- Lesson: leitura, perguntas explicadas e recuperação dos erros.
- Kana: tabela, fileiras e configuração das rodadas.
- Practice: rodada reutilizável, respostas e repetição dos erros.
- Writing: modelos, animação e canvas.
- Sentences: blocos e digitação para situações específicas.
- Reference: kanji, partículas, expressões, biblioteca e revisão.
- Study: palavras por tema, exercícios, escuta e glossário.
- Worksheets/Book 1: folhas avulsas e volume de impressão compilado do currículo existente, sem conteúdo paralelo.
- Teacher/Package: seleção de etapa ou tema codificada no link público; não há tabela de turmas, contas de aluno nem acesso ao progresso individual.
- Worksheets: folhas A4 de caracteres, palavras e frases com gabaritos opcionais; seleção livre de caracteres e páginas extras de repetição vazias.
- Settings: modo visual, áudio, romaji, meta diária, indicadores e conquistas.

## Persistência

O schema v2 contém lessons, reviews, activity, preferences e updatedAt, além
dos campos anteriores progress, kanaStats, xp, streak e stats. Os campos placement
e restDays registram o diagnóstico e as pausas protegidas sem alterar dados anteriores.

A normalização limita números, valida estruturas e converte revisões antigas.
A mesclagem mantém a união das conclusões e os registros de revisão mais
recentes; contadores históricos preservam o maior valor.

O navegador grava imediatamente em `maru-learning-v2` para convidados e em
`maru-account-<id>-v2` para cada conta. A importação anônima é feita uma vez por
conta neste navegador; logout restaura o perfil anônimo sem misturar caches. Chaves
`maru-*-v1` e `nihongo-dojo-*-v1` são lidas na primeira migração e permanecem
intactas. O envio ao servidor é serializado, com debounce, timeout e retomada
ao voltar à conexão. A UI distingue salvamento no servidor, somente no
navegador e somente na sessão.

O `maru-backend` normaliza novamente e mescla snapshots na tabela
`public.maru_progress` do Supabase com controle de versão. Contas por e-mail usam
Supabase Auth e cookies HttpOnly; a identificação anônima nunca permite escolher
uma conta. A identidade é conferida antes das escritas para impedir misturas ao
trocar login. O adaptador SQLite permanece somente para desenvolvimento local
e leitura de dados legados. Veja a documentação do backend para publicação e
recuperação de dados.

## Regras de aprendizado

Uma lição exige responder corretamente a todas as perguntas. As erradas são
explicadas e retornam antes da conclusão. Os 30 XP são concedidos uma vez.

Rodadas usam no máximo dez itens. Cada resposta verificada é registrada uma
vez antes do avanço. Distratores são distintos e pertencem ao mesmo tipo de
pergunta. Três acertos seguidos são um indicador de prática, não uma certificação.

Erros retornam em dez minutos. Acertos começam com um intervalo de um dia e
dobram até sessenta dias. A prática livre continua disponível.

O registro de escrita concede 5 XP uma vez por folha/caractere aberto e não
altera o desempenho de reconhecimento de kana. A caligrafia é autoavaliada.

## Frases, áudio e escrita

A API de frases recebe exerciseId e text. Compara modelos canônicos em japonês,
leituras em kana e formas de romaji previstas. Divergência significa “diferente
do modelo”, não “gramaticalmente impossível”. O mesmo código funciona localmente.
O formato legado com item permanece, sem dar notas artificiais a frases livres.

O áudio usa `POST /api/audio`. O `speechService.js` do backend valida o texto contra o catálogo
de estudo, consulta TTS Quest e devolve uma URL de streaming. Só URLs expiráveis
ficam em memória; o servidor e o frontend não escrevem áudio no disco. O player
cancela requisições e reprodução ao navegar, respeita a velocidade escolhida e
trata falhas, limites da API e bloqueio de reprodução automática.

`core/kanji.js` consulta KanjiAPI ao abrir um caractere. Valida campos, compartilha
requisições simultâneas, mantém cache de 24 horas e usa a cópia dos 20 caracteres
se a rede falhar. As explicações e traduções em português continuam sendo autorais.

`frontend/assets/data/strokes.json` contém os caminhos em ordem extraídos de
KanjiVG: 142 kana e 20 kanji. A atualização é manual:
`python3 scripts/fetch-strokes.py`. O uso normal não precisa da rede.
O arquivo derivado mantém CC BY-SA 3.0 e atribuição.

O canvas usa coordenadas normalizadas e redesenha ao mudar de tamanho.
Pointer Events permitem mouse, toque e caneta. Mostrar o guia não limpa o
desenho. Animações respeitam a preferência por movimento reduzido.

## CSS

A folha anterior foi substituída integralmente:

- foundation/tokens.css: cores, fontes e tokens estruturais;
- foundation/base.css: reset, tipografia, foco e movimento;
- layout.css: shell, navegação, cabeçalhos e rodapé;
- components.css: botões, campos, exemplos e feedback;
- screens.css: composição de cada tela;
- themes/arcade.css: variantes do modo Arcade, condicionadas por data-theme;
- themes/heisei.css: cores pastéis e detalhes de caderno do estilo Heisei Girly;
- responsive.css: desktop, tablet e celular, com prioridade sobre o tema;
- learning.css: vocabulário, exercícios, temas, missões e conquistas;
- navigation.css: navegação simplificada, páginas Praticar/Explorar e busca;
- motion.css: entradas, interação e movimento das ilustrações;
- print.css: papel A4, grades sem degradê e paginação independente do tema.

Dojo usa papel claro (#f8f7f3), superfícies quase brancas, washi em SVG estático, tinta escura,
Shippori Mincho e vermelho de hanko. themes/dojo.css concentra essa identidade;
experience.css compõe as novas telas e contém o selo da home em tamanhos móveis. Arcade usa pixels e neon; Heisei Girly usa cores pastéis e detalhes desenhados em CSS.
Os seletores de Arcade usam `:where()` para não impedir os ajustes de responsividade.
A troca atualiza tokens sem reconstruir o DOM da atividade. Fontes externas têm
fallbacks locais. React, Motion e Anime.js foram removidos; as animações de
traços usam a Web Animations API.
As animações de interface usam CSS, respeitam prefers-reduced-motion e são
desativadas na impressão. Ilustrações usam transformações; textos não recebem
animação contínua. A troca de tema continua preservando a atividade em andamento.

## API

| Método | Caminho | Uso |
| --- | --- | --- |
| GET | /api/health | Saúde e versão. |
| GET | /api/content | Currículo, catálogos e campos legados. |
| GET | /api/progress | Snapshot normalizado. |
| PUT / POST | /api/progress | Persistência de snapshot. |
| POST | /api/phrase/check | Comparação com o modelo de uma atividade. |
| POST | /api/audio | URL de reprodução remota de uma pronúncia do catálogo. |

GET /api/account informa a sessão; GET /api/auth/google inicia OAuth;
GET /api/auth/google/callback valida state, PKCE, nonce e identidade.
POST /api/auth/logout revoga a sessão.
O navegador envia o perfil anônimo em x-maru-user; contas são resolvidas pelo cookie.
Escritas de conta exigem a identidade esperada em x-maru-account e origem válida.
Esse cabeçalho previne gravações de abas obsoletas e não autentica sozinho.
JSON inválido retorna 400; corpo excessivo, 413; caminhos inexistentes, 404.

## Verificação

`npm run check` verifica sintaxe dos módulos e imports das folhas de estilo.
`npm test` cobre currículo, respostas, traços, migração, revisão e constância.
Os contratos HTTP e as gravações concorrentes são testados no `maru-backend`.

`npm run test:e2e` usa servidor e dados isolados. Verifica conclusão e retomada,
erros, kana digitado, frases, escrita, filtros, revisão, fallback local,
histórico e teclado. As telas são verificadas em 320, 390, 768 e 1440 pixels
com captura dos erros do navegador.

Os testes de voz usam respostas controladas e áudio em memória para não consumir
a cota pública. Uma verificação separada confirmou reprodução real do streaming
TTS Quest. PDFs são gerados no teste e conferidos por número de páginas.


## Camadas de descoberta e orientação

O diagnóstico é acessado pela home e configurações, sem item extra no menu.
Seu resultado não passa por completeLesson ou recordReview: apenas placement é
salvo. learningPath.js seleciona a próxima lição a partir da etapa aceita. Etapas
anteriores continuam livres e aparecem como revisão opcional.

Trilhas temáticas ficam em
Descobrir, assim como os imprimíveis. Cápsulas aparecem na última explicação da
lição correspondente. Selos derivam de todas as lições reais de uma etapa; não são
uma segunda fonte de verdade para o progresso.

O material para professores também fica em Descobrir e pode ser acessado pela
home. O Livro 1 usa as lições e catálogos já publicados, imprime gabaritos ao
final e não afirma equivalência a uma certificação JLPT. As artes do Irasutoya
têm inventário de origem e registro da autorização informada pela responsável
para o uso educacional gratuito do Maru, sem o antigo teto interno de 20.
Todo o acesso ao conteúdo permanece gratuito, sem pedidos de apoio financeiro.

Um único dia sem estudo pode ser protegido por semana de segunda a domingo.
A proteção só é registrada quando a pessoa volta no dia seguinte à pausa e não
gera atividades ou XP. Lacunas maiores ou uma segunda pausa na semana reiniciam
a sequência. A contagem continua medindo dias em que houve estudo.

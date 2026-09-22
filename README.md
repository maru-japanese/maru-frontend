# Maru Frontend

Interface do [Maru](https://github.com/maru-japanese), uma plataforma gratuita em português para aprender japonês desde o primeiro contato com o idioma.

O Maru organiza o estudo em uma trilha clara e acolhedora: a pessoa aprende o alfabeto, pratica escrita e pronúncia, monta frases e revisa o conteúdo no próprio ritmo. Este repositório contém somente a experiência no navegador e o conteúdo didático. API, contas e persistência ficam no [`maru-backend`](https://github.com/maru-japanese/maru-backend).

## O que a interface oferece

- 37 lições distribuídas em 8 etapas, do primeiro contato a conversas cotidianas;
- hiragana, katakana, kanji, vocabulário, partículas e construção de frases;
- prática de escrita com ordem dos traços, áudio e revisão espaçada;
- diagnóstico inicial e uma trilha que indica o próximo passo;
- modos visuais Dojo e Arcade, metas, constância e conquistas;
- estudo anônimo no navegador ou sincronização entre aparelhos com uma conta.

## Rodar localmente

Requer Node.js 22 ou mais recente. Mantenha os dois repositórios lado a lado:

```text
maru-japanese/
├── maru-backend/
└── maru-frontend/
```

No primeiro terminal:

```bash
cd maru-backend
npm install
cp .env.example .env
npm run dev
```

No segundo:

```bash
cd maru-frontend
npm install
cp .env.example .env
npm run dev
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). O servidor de desenvolvimento entrega os arquivos estáticos e encaminha `/api` para o backend.
O progresso continua disponível no navegador se a API estiver temporariamente indisponível.

## Configuração

| Variável           | Uso                                                                    |
| ------------------- | ---------------------------------------------------------------------- |
| `HOST` | Interface de rede do servidor local; padrão: `127.0.0.1`. |
| `PORT` | Porta do frontend; padrão: `4173`. |
| `MARU_API_ORIGIN` | Endereço da API no desenvolvimento; padrão: `http://127.0.0.1:5173`. |

Nenhum segredo deve ser colocado no frontend. Credenciais Google, chave de voz e configuração de persistência pertencem ao backend.

## Comandos

```bash
npm run dev          # frontend local com proxy para /api
npm run check        # sintaxe dos módulos e imports de CSS
npm test             # regras de aprendizado e conteúdo
npm run test:e2e     # fluxo completo; requer o maru-backend ao lado
npm run content:new -- --id nova-licao --module everyday --title "Minha lição"
```

Antes do E2E, instale o navegador com `npx playwright install chromium`. Os testes iniciam os dois projetos em portas isoladas e usam uma pasta temporária para os dados da API.

## Organização

| Caminho       | Responsabilidade                                        |
| ------------- | ------------------------------------------------------- |
| `frontend/` | HTML, estilos, imagens e controladores de tela.         |
| `shared/`   | Currículo e regras de aprendizado usadas no navegador. |
| `scripts/`  | Servidor local, validação e ferramentas editoriais.   |
| `tests/`    | Testes unitários e jornadas de navegador.              |
| `docs/`     | Arquitetura, conteúdo e critérios editoriais.         |

Consulte [a arquitetura](docs/ARCHITECTURE.md), [o guia de conteúdo](docs/CONTENT.md) e [a publicação do frontend](docs/DEPLOYMENT.md) para contribuir.

## Publicação

O site é estático e o `netlify.toml` gera `dist/` com `frontend/` e `shared/`. Em produção, configure o host ou proxy para encaminhar `/api/*` ao `maru-backend` sob o mesmo domínio público. Isso mantém cookies de sessão e a proteção de origem funcionando sem expor credenciais no navegador.

Os modelos de traços usam [KanjiVG](https://kanjivg.tagaini.net/) sob [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), com atribuição na interface e em [LICENSE.md](frontend/assets/data/LICENSE.md). Veja também [APIs e créditos](docs/INTEGRATIONS.md).

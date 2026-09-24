# Maru Frontend

Interface do [Maru](https://github.com/maru-japanese), uma plataforma gratuita em português para aprender japonês desde o primeiro contato com o idioma.

O Maru organiza o estudo em uma trilha clara e acolhedora: a pessoa aprende o alfabeto, pratica escrita e pronúncia, monta frases e revisa o conteúdo no próprio ritmo. Este repositório contém somente a experiência no navegador e o conteúdo didático. API, contas e persistência ficam no [`maru-backend`](https://github.com/maru-japanese/maru-backend).

## O que a interface oferece

- 37 lições distribuídas em 8 etapas, do primeiro contato a conversas cotidianas;
- hiragana, katakana, kanji, vocabulário, partículas e construção de frases;
- prática de escrita com ordem dos traços, áudio e revisão espaçada;
- folhas A4 para imprimir um, 20 recomendados, mais de 20 ou todos os caracteres; cada família de kana em sua folha, com quadrados pequenos lado a lado, espaços em YA/YU/YO e WA/WO/O/N, e páginas extras de repetição com guias tracejadas;
- atividades A4 de associação entre imagens e palavras, diálogos para completar e perguntas de compreensão, separadas ou em um pacote, com gabarito opcional;
- Livro 1 completo para imprimir, com as 37 lições, práticas de escrita, palavras, frases, partículas, imagens, diálogos e gabaritos;
- pacotes públicos para professores compartilharem uma etapa ou trilha temática com a turma, sem conta de aluno ou acompanhamento individual;
- diagnóstico inicial e uma trilha que indica o próximo passo;
- estilos visuais Dojo, Arcade e Heisei Girly, metas, constância e conquistas;
- estudo anônimo no navegador ou sincronização entre aparelhos com uma conta por e-mail.

Todo o conteúdo é gratuito, sem pedidos de apoio financeiro. As ilustrações do Irasutoya têm fontes e registro da autorização informada pela responsável em [IRASUTOYA.md](frontend/assets/img/IRASUTOYA.md). O antigo teto interno de 20 foi retirado para o uso educacional gratuito do Maru.

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

Nenhum segredo deve ser colocado no frontend. Credenciais SMTP, chave de voz e configuração de persistência pertencem ao Supabase/backend. O adaptador Node local não implementa o login por e-mail; para testar esse fluxo, use a Edge Function e uma origem de teste permitida no Supabase Auth.

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

O site é estático. `npm run build` gera `dist/` com `frontend/` e `shared/`, e
`vercel.json` publica essa pasta na Vercel. As requisições `/api/*` são
encaminhadas à Edge Function `maru-api` no Supabase, sob o domínio do site.
A origem pública confirmada é `https://maru-frontend.vercel.app`; mantenha-a
igual na função Supabase e nas URLs permitidas do Auth antes de liberar o cadastro por e-mail. SMTP próprio é necessário para entregar confirmações e recuperações ao público.

Os modelos de traços usam [KanjiVG](https://kanjivg.tagaini.net/) sob [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), com atribuição na interface e em [LICENSE.md](frontend/assets/data/LICENSE.md). Veja também [APIs e créditos](docs/INTEGRATIONS.md).

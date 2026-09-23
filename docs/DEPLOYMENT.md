# Publicação do frontend na Vercel

## Pré-requisitos

- `maru-api` publicada no projeto Supabase `qxtgaalmyzyldmcpwooo`;
- migração `maru_progress` aplicada no Postgres;
- origem pública `https://maru-frontend.vercel.app` configurada na Edge Function;
- e-mail/senha habilitado no Supabase Auth; SMTP próprio para cadastro público.

As etapas de banco, Auth e Edge Function estão no
[`maru-backend`](https://github.com/maru-japanese/maru-backend).

## Build

```bash
npm ci
npm run check
npm test
npm run build
```

O build copia `frontend/` e `shared/` para `dist/`. Nenhuma credencial entra nos
arquivos estáticos. A configuração da Vercel em `vercel.json` define `dist/` como
saída e encaminha `/api/*` para a Edge Function do projeto informado.

## Projeto Vercel

Importe o repositório `maru-frontend` como projeto Vercel com o nome
`maru-frontend`. A raiz do projeto
deve ser o próprio repositório; o arquivo `vercel.json` já define o comando de
build e o diretório publicado. Para a URL informada, depois de confirmar que o
projeto Vercel está sob seu controle:

1. Mantenha `https://maru-frontend.vercel.app` como origem permitida da Edge Function.
2. Defina `https://maru-frontend.vercel.app` como Site URL e permita essa origem
   nas Redirect URLs do Supabase Auth.
3. Configure SMTP próprio no painel Auth; o envio padrão não atende contas
   públicas. Mantenha as credenciais SMTP fora do repositório.
4. Verifique `/api/health`, uma lição sem conta, cadastro, confirmação, login,
   recuperação e logout em uma janela privada.

O navegador vê o mesmo domínio para o site e `/api`. A Edge Function mantém a
sessão em cookies `HttpOnly` e compara a origem pública nas escritas.

## Desenvolvimento local

`npm run dev` serve o frontend em `http://127.0.0.1:4173` e encaminha `/api`
para `MARU_API_ORIGIN`, definido em `.env`. O servidor Node do repositório
`maru-backend` é um adaptador local/legado, não o backend de produção.

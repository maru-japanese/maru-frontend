# Publicação do frontend na Vercel

## Pré-requisitos

- `maru-api` publicada no projeto Supabase `qxtgaalmyzyldmcpwooo`;
- migração `maru_progress` aplicada no Postgres;
- `MARU_PUBLIC_ORIGIN` da Edge Function igual à origem pública do site;
- Google OAuth configurado no Supabase se o login for oferecido.

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

Importe o repositório `maru-frontend` como projeto Vercel. A raiz do projeto
deve ser o próprio repositório; o arquivo `vercel.json` já define o comando de
build e o diretório publicado. Depois de escolher o domínio público:

1. Defina esse domínio como `MARU_PUBLIC_ORIGIN` na Edge Function, sem barra final.
2. Adicione `https://seu-dominio/api/auth/google/callback` às URLs de
   redirecionamento permitidas no Supabase Auth.
3. No Google Cloud, configure o callback do provedor apontando para o endereço
   mostrado na configuração de Google do Supabase Auth.
4. Verifique `/api/health`, uma lição sem conta e o login em uma janela privada.

O navegador vê o mesmo domínio para o site e `/api`. A Edge Function mantém a
sessão em cookies `HttpOnly` e compara a origem pública nas escritas.

## Desenvolvimento local

`npm run dev` serve o frontend em `http://127.0.0.1:4173` e encaminha `/api`
para `MARU_API_ORIGIN`, definido em `.env`. O servidor Node do repositório
`maru-backend` ainda pode ser usado como adaptador local enquanto a migração de
dados e a configuração remota do Supabase são concluídas.

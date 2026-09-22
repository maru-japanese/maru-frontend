# Publicação do frontend

## Ambiente local

O frontend usa módulos JavaScript nativos e requer Node.js 22 ou mais recente
apenas para o servidor de desenvolvimento e as verificações.

```bash
npm ci
cp .env.example .env
npm run dev
```

`MARU_API_ORIGIN` define para onde o servidor local encaminha `/api`. O padrão é
`http://127.0.0.1:5173`, usado pelo `maru-backend`.

## Gerar os arquivos estáticos

O comando de build do `netlify.toml` copia `frontend/` e `shared/` para `dist/`:

```bash
rm -rf dist
mkdir -p dist
cp -R frontend/. dist/
cp -R shared dist/shared
```

Nenhuma variável secreta ou credencial deve ser incorporada aos arquivos. A
configuração pública é consultada em `/api/config`.

## API no mesmo domínio

O navegador sempre chama caminhos relativos em `/api`. No ambiente publicado,
configure o proxy da hospedagem para encaminhar `/api/*` ao backend e servir os
demais caminhos a partir de `dist/`.

```text
https://maru.exemplo/           -> frontend estático
https://maru.exemplo/api/health -> maru-backend
```

Manter uma única origem simplifica os cookies de sessão e permite que o backend
valide escritas e retornos do OAuth. No backend, `MARU_PUBLIC_ORIGIN` deve ser
exatamente a origem pública do site, sem caminho.

## Verificação

```bash
npm run check
npm test
npx playwright install chromium
npm run test:e2e
```

O E2E espera que `maru-backend` e `maru-frontend` sejam pastas irmãs. Ele inicia
os dois processos em portas isoladas e usa armazenamento temporário.

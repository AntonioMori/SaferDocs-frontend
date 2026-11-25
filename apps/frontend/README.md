# SaferDocs - Frontend

Interface web do SaferDocs: assinatura de PDF, verificação pública de documento e gestão de
segurança da conta (2FA, sessões, passkeys).

**Stack:** React 19 + Vite + TypeScript, template **Minimals (MUI/Emotion)** no lugar do Tailwind
(RNF-03, combinado com o professor). Roteamento com `react-router`, formulários com
`react-hook-form` + `zod`.

## Como rodar

Requisitos: Node.js >= 22.12 e Yarn (`yarn@1.22.22`).

```sh
yarn install --frozen-lockfile
cp .env.example .env   # ajuste se precisar
yarn dev        # http://localhost:3039
```

A porta 3039 é a origem liberada no CORS do backend. Se o `yarn` não estiver instalado
globalmente, use `npx --yes yarn@1.22.22 <comando>`.

| Script            | O que faz                                |
| :---------------- | :--------------------------------------- |
| `yarn dev`        | Servidor de desenvolvimento              |
| `yarn build`      | `tsc` + build de produção em `dist/`     |
| `yarn start`      | Serve o build (`vite preview`)           |
| `yarn lint`       | ESLint em `src/`                         |
| `yarn fm:check`   | Confere a formatação (Prettier)          |
| `yarn tsc:check`  | Checagem de tipos sem gerar arquivos     |

O gerenciador de pacotes oficial é o **Yarn** (`packageManager: yarn@1.22.22`, `yarn.lock`).

## Configuração (`.env`)

O modelo com todas as variáveis é o `.env.example`. Tudo que muda entre ambientes vem de variáveis `VITE_*` no `.env` (nenhuma URL fica no código):

| Variável            | Para quê                                                            |
| :------------------ | :------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | Prefixo da API, relativo à origem do front (`/api/v1`)              |
| `VITE_SERVER_URL`   | Backend que recebe o proxy `/api` do Vite em dev (não vai ao bundle) |
| `VITE_ASSETS_DIR`   | Pasta base dos assets estáticos (vazio = raiz)                      |

Variáveis `VITE_*` ficam visíveis no navegador: nunca ponha segredo nelas.

O env é validado com zod (`src/env-schema.ts`) ao subir: `yarn dev` e `yarn build` falham com a lista das variáveis ausentes ou inválidas, e o app também recusa iniciar no navegador (`src/global-config.ts`). `VITE_API_BASE_URL` é obrigatória; em dev, `VITE_SERVER_URL` também.

## Erros da API

O backend responde todo erro como `{code, message, timestamp, request_id, fields?}`. O interceptor
de `src/lib/axios.ts` converte isso em `ApiError` (`src/lib/api-error.ts`), com `code`, `message`,
`status`, `requestId` e `fields`. Falha de rede vira `NET_000` e resposta fora do padrão vira
`UNKNOWN`. Em formulários (`src/components/hook-form/api-error.ts`):

```ts
try {
  await axios.post(endpoints.auth.signUp, values);
} catch (error) {
  handleApiFormError(methods, error); // campo certo no `fields`, senão toast com a mensagem
}
```

`setApiFieldErrors` só aplica os campos (aceita `mapField` para nomes diferentes) e
`showApiError` só mostra o toast.

## Rotas

| Rota                | Página             | Acesso      |
| :------------------ | :----------------- | :---------- |
| `/entrar`           | Login              | Visitante   |
| `/cadastro`         | Cadastro           | Visitante   |
| `/2fa`              | Passo do TOTP      | Visitante   |
| `/verificar`        | Verificar PDF      | **Pública** |
| `/assinar`          | Assinar PDF        | Logado      |
| `/conta/seguranca`  | Segurança da conta | Logado      |
| `/conta/sessoes`    | Sessões ativas     | Logado      |
| `/conta/passkeys`   | Passkeys           | Logado      |
| `/error/403`        | Acesso negado      | Pública     |
| `/error/404`        | Não encontrada     | Pública     |
| `/error/500`        | Erro interno       | Pública     |

As páginas são esqueletos (`PageStub`) com links para todas as outras. Cada issue de
funcionalidade substitui o esqueleto pela tela real. Os guards (`src/auth/guard`) existem, mas
ainda não envolvem as rotas: entram com o provider de sessão (REQ-20).

## Arquitetura de pastas

```
src/
├─ main.tsx, app.tsx       # entrada, providers (tema, configurações, auth)
├─ global-config.ts        # configuração do app (CONFIG)
├─ lib/axios.ts            # cliente HTTP
├─ routes/
│  ├─ paths.ts             # única fonte dos caminhos
│  ├─ sections/            # definição das rotas (index.tsx, dashboard.tsx)
│  ├─ components/, hooks/  # RouterLink, ErrorBoundary, useRouter etc.
├─ pages/                  # uma página por rota, só metadados + a view
├─ sections/               # telas por domínio
│  ├─ sign/view/           # assinatura de PDF
│  ├─ verify/view/         # verificação pública
│  ├─ account/view/        # segurança, sessões, passkeys
│  └─ error/               # 403, 404, 500
├─ auth/                   # contexto, guards, views de login/cadastro/2FA
├─ layouts/                # auth-centered, dashboard, simple e core
├─ components/             # componentes reutilizáveis (hook-form, page-stub, iconify...)
├─ theme/                  # tema MUI (cores, tipografia, overrides)
└─ assets/                 # ilustrações e ícones SVG
```

Convenções: `pages/` não tem lógica; a tela mora em `sections/<domínio>/view`; telas de
autenticação ficam em `auth/view`. Importe sempre por `src/...`.

## Origem do código

Baseado no template **Minimals (versão starter/lite)**. Foram mantidos apenas o tema, os layouts
de autenticação, dashboard e simples, e os componentes necessários para a aplicação. Demos e
páginas de exemplo foram substituídos pelo esqueleto do SaferDocs.

## CSP e headers do front (REQ-37)

A página é servida pelo Vite (`yarn dev` e `yarn start`) ou, no deploy, pelo nginx. O backend já manda a CSP `default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'` nas respostas da API. Para o HTML do front, a política mínima que a aplicação precisa é:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none'
```

| Diretiva | Por quê |
| :--- | :--- |
| `script-src 'self'` | Sem script inline no `index.html` e sem CDN. O worker do pdf.js é empacotado pelo Vite (`pdfjs-dist/build/pdf.worker.min.mjs?url`) e sai do próprio domínio. |
| `style-src ... 'unsafe-inline'` | O Emotion/MUI injeta `<style>` em tempo de execução. É o único relaxamento. |
| `img-src ... data: blob:` | Pré-visualização do PDF (canvas) e imagens pequenas inlinadas pelo build. |
| `font-src 'self' data:` | Fontes locais (`@fontsource`), nenhuma do Google Fonts. |
| `connect-src 'self'` | A API é chamada pela mesma origem (`/api/v1`): proxy do Vite em dev, nginx no deploy. |
| `worker-src 'self' blob:` | Worker do pdf.js. |

Também devem ir `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy: camera=(), microphone=(), geolocation=()` (REQ-39 a 42).

- Os headers ficam em `security-headers.ts` e entram em `server.headers` e `preview.headers` do `vite.config.ts`. O `yarn dev` só relaxa `script-src` (o Vite injeta um script inline do Fast Refresh) e `connect-src` (WebSocket do HMR). O `yarn start` (preview do build) usa a política fechada acima: é com ele que se confere um console sem violações.
- Ícones: o `Iconify` do template registra os conjuntos em `src/components/iconify/icon-sets.ts` com `addCollection`. Ícone que não estiver ali seria buscado em `api.iconify.design`, que a CSP bloqueia; por isso o nome do ícone é tipado e o `tsc` barra um ícone não registrado. Para usar um novo, adicione-o ao `icon-sets.ts`.
- Nada de CDN: não há `<script>`, `<link>` ou imagem de domínio externo.

Exemplo de nginx para o deploy:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
location /api/ { proxy_pass http://backend:8000; }
location / { try_files $uri /index.html; }
```

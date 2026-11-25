/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Prefixo da API, relativo à origem do front (ex.: `/api/v1`). */
  readonly VITE_API_BASE_URL?: string;
  /** Pasta base dos assets estáticos (vazio = raiz). */
  readonly VITE_ASSETS_DIR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

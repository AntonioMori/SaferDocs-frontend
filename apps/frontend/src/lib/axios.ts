import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { toApiError } from './api-error';
import { getAccessToken } from './access-token';

// ----------------------------------------------------------------------

/**
 * Cliente HTTP único do front (RNF-01).
 *
 * Toda chamada à API passa por aqui: nenhum outro arquivo deve usar `fetch`,
 * `XMLHttpRequest` ou criar outra instância do axios. A `baseURL` vem do env
 * (`/api/v1`) e, em dev, o proxy do Vite repassa `/api` para o backend, então
 * o navegador fala sempre com a mesma origem e o cookie do refresh funciona.
 */
/** Limite das chamadas JSON. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Limite dos uploads de PDF (assinar e verificar), que levam mais tempo. */
export const UPLOAD_TIMEOUT_MS = 120_000;

const axiosInstance = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------------------------------------------------------

/** Gera o id que o backend devolve no erro e nos logs (`^[A-Za-z0-9._-]{1,64}$`). */
export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Rotas de autenticação: as únicas que precisam do cookie do refresh (`Path=/api/v1/auth`). */
export function isAuthRoute(url: string | undefined): boolean {
  return url === '/auth' || !!url?.startsWith('/auth/');
}

axiosInstance.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', createRequestId());

  // O access token sai da memória a cada requisição (REQ-20), nunca de um header fixo
  // deixado em `axios.defaults`. Quem já mandou o próprio Authorization é respeitado.
  const token = getAccessToken();
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  // Credenciais (cookie) só nas rotas de autenticação (REQ-20).
  config.withCredentials = isAuthRoute(config.url);

  return config;
});

/**
 * Normaliza todo erro de resposta em `ApiError` (RNF-12). Quem chamar a API pode usar
 * `isApiError(error)` e ler `code`, `message`, `fields` e `requestId`.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const res = await axiosInstance.get<T>(url, config);

  return res.data;
};

// ----------------------------------------------------------------------

/** Caminhos relativos à `baseURL` (`/api/v1`). */
export const endpoints = {
  auth: {
    me: '/auth/me',
    signIn: '/auth/login',
    refresh: '/auth/refresh',
    signUp: '/auth/register',
    passkeys: {
      list: '/auth/passkeys',
      item: (id: string) => `/auth/passkeys/${encodeURIComponent(id)}`,
      registerOptions: '/auth/passkeys/register/options',
      registerVerify: '/auth/passkeys/register/verify',
      loginOptions: '/auth/passkeys/login/options',
      loginVerify: '/auth/passkeys/login/verify',
    },
  },
  documents: {
    sign: '/documents/sign',
    signatures: '/documents/signatures',
  },
  verify: '/verify',
} as const;

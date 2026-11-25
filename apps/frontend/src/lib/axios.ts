import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { toApiError } from './api-error';

// ----------------------------------------------------------------------

/**
 * Cliente HTTP único do front (RNF-01).
 *
 * Toda chamada à API passa por aqui: nenhum outro arquivo deve usar `fetch`,
 * `XMLHttpRequest` ou criar outra instância do axios. A `baseURL` vem do env
 * (`/api/v1`) e, em dev, o proxy do Vite repassa `/api` para o backend, então
 * o navegador fala sempre com a mesma origem e o cookie do refresh funciona.
 */
const axiosInstance = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  withCredentials: true,
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

axiosInstance.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', createRequestId());
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
    signUp: '/auth/register',
  },
  documents: {
    sign: '/documents/sign',
    signatures: '/documents/signatures',
  },
  verify: '/verify',
} as const;

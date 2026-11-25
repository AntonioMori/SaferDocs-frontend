import type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios, { isAxiosError } from 'axios';

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

// ----------------------------------------------------------------------

/**
 * Renovação automática do access token (REQ-29).
 *
 * O cliente HTTP não conhece a sessão: o módulo de autenticação registra aqui como renovar
 * (`refresh`, que já é single-flight) e o que fazer quando não der (`onRefreshFailed`).
 */
type SessionRefresher = {
  /** Troca o cookie por um access novo e o devolve. Chamadas simultâneas usam a mesma requisição. */
  refresh: () => Promise<string>;
  /** O refresh falhou (expirado, revogado ou reuso, REQ-30): limpar a sessão e ir para o login. */
  onRefreshFailed: () => void;
};

let sessionRefresher: SessionRefresher | null = null;

export function registerSessionRefresher(refresher: SessionRefresher | null): void {
  sessionRefresher = refresher;
}

/**
 * Rotas que respondem 401 por credencial errada (senha, código, passkey) ou pelo próprio refresh,
 * não por access vencido: nunca disparam a renovação. Comparação por prefixo do caminho.
 */
const NO_REFRESH_PREFIXES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/passkeys/login/'];

const skipsRefresh = (url: string | undefined) =>
  !url || NO_REFRESH_PREFIXES.some((prefix) => url.startsWith(prefix));

type RetriableConfig = InternalAxiosRequestConfig & { _sessionRetried?: boolean };

const bearerOf = (config: InternalAxiosRequestConfig) =>
  String(config.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '') || null;

/**
 * 401 numa requisição que levava o access token: renova uma única vez e repete a original.
 *
 * - Se outra requisição já renovou enquanto esta estava no ar, só repete com o token atual.
 * - Várias requisições que falham juntas compartilham o mesmo refresh (single-flight).
 * - A requisição repetida que falhar de novo não renova outra vez (sem laço).
 */
async function retryWithFreshToken(error: unknown): Promise<AxiosResponse> {
  if (!isAxiosError(error) || error.response?.status !== 401 || !error.config || !sessionRefresher) {
    throw toApiError(error);
  }

  const config = error.config as RetriableConfig;
  const sentToken = bearerOf(config);

  if (config._sessionRetried || !sentToken || skipsRefresh(config.url)) {
    throw toApiError(error);
  }

  config._sessionRetried = true;

  const current = getAccessToken();
  let token: string;

  if (current && current !== sentToken) {
    token = current;
  } else {
    try {
      token = await sessionRefresher.refresh();
    } catch {
      sessionRefresher.onRefreshFailed();
      throw toApiError(error);
    }
  }

  config.headers.set('Authorization', `Bearer ${token}`);

  return axiosInstance(config);
}

/**
 * Normaliza todo erro de resposta em `ApiError` (RNF-12). Quem chamar a API pode usar
 * `isApiError(error)` e ler `code`, `message`, `fields` e `requestId`.
 */
axiosInstance.interceptors.response.use((response) => response, retryWithFreshToken);

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
    signInTotp: '/auth/login/totp',
    refresh: '/auth/refresh',
    signOut: '/auth/logout',
    password: '/auth/password',
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

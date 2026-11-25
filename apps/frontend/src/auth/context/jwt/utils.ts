import type { TokenResponse } from '../../types';

import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/lib/axios';
import { setAccessToken } from 'src/lib/access-token';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

/**
 * Sessão no navegador (REQ-20).
 *
 * - O access token fica só em memória (`src/lib/access-token`).
 * - O refresh token fica no cookie HttpOnly `Path=/api/v1/auth`; o JS nunca o lê.
 * - Ao abrir ou recarregar a página, `refreshSession()` troca o cookie por um access novo.
 * - Pouco antes de o access vencer, a sessão é renovada sozinha; se não der, vai para o login.
 */

/** Renova um pouco antes do fim, para não mandar requisição com token prestes a vencer. */
const RENEW_BEFORE_SECONDS = 60;
const MIN_RENEW_DELAY_SECONDS = 5;

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre de novo.';
const REDIRECT_DELAY_MS = 2000;

let renewTimer: ReturnType<typeof setTimeout> | null = null;

function clearRenewTimer() {
  if (renewTimer !== null) {
    clearTimeout(renewTimer);
    renewTimer = null;
  }
}

// ----------------------------------------------------------------------

/** Guarda o access token em memória e agenda a renovação; `null` encerra a sessão local. */
export function setSession(data: Pick<TokenResponse, 'access_token' | 'expires_in'> | null) {
  clearRenewTimer();

  if (!data) {
    setAccessToken(null);
    return;
  }

  setAccessToken(data.access_token);

  const delay = Math.max(data.expires_in - RENEW_BEFORE_SECONDS, MIN_RENEW_DELAY_SECONDS);
  renewTimer = setTimeout(renewInBackground, delay * 1000);
}

// ----------------------------------------------------------------------

let inflightRefresh: Promise<TokenResponse> | null = null;

/**
 * `POST /auth/refresh`: troca o cookie por um par novo e guarda o access em memória.
 *
 * Single-flight: chamadas simultâneas compartilham a mesma requisição. O backend roda o refresh
 * (REQ-29) e trata o reuso de um refresh já trocado como roubo (REQ-30), derrubando a família
 * inteira; duas chamadas em paralelo com o mesmo cookie, como faz o StrictMode do React ao montar
 * o provider duas vezes, encerrariam a sessão.
 */
export function refreshSession(): Promise<TokenResponse> {
  if (!inflightRefresh) {
    inflightRefresh = axios
      .post<TokenResponse>(endpoints.auth.refresh)
      .then(({ data }) => {
        setSession(data);
        return data;
      })
      .catch((error) => {
        setSession(null);
        throw error;
      })
      .finally(() => {
        inflightRefresh = null;
      });
  }

  return inflightRefresh;
}

// ----------------------------------------------------------------------

/** Encerra a sessão local, avisa e manda para o login (recarregar limpa todo o estado em memória). */
export function expireSession(message = SESSION_EXPIRED_MESSAGE) {
  setSession(null);

  toast.error(message);

  setTimeout(() => {
    window.location.href = paths.entrar;
  }, REDIRECT_DELAY_MS);
}

function renewInBackground() {
  renewTimer = null;

  // Sem log do erro: um ApiError carrega a requisição original na `cause`.
  refreshSession().catch(() => expireSession());
}

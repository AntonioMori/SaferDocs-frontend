import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  if (!token) return null;

  // Não registra o erro no console: a mensagem do parser pode carregar trechos do token.
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid token!');
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  return JSON.parse(atob(base64));
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre de novo.';
const REDIRECT_DELAY_MS = 2000;

/** Id do timer de expiração da sessão atual; guardado para poder ser cancelado. */
let expirationTimer: ReturnType<typeof setTimeout> | null = null;

function clearExpirationTimer() {
  if (expirationTimer !== null) {
    clearTimeout(expirationTimer);
    expirationTimer = null;
  }
}

export function tokenExpired(exp: number) {
  clearExpirationTimer();

  const timeLeft = exp * 1000 - Date.now();

  expirationTimer = setTimeout(() => {
    expirationTimer = null;

    sessionStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;

    toast.error(SESSION_EXPIRED_MESSAGE);

    // Dá tempo de ler o aviso antes de a página recarregar na tela de login.
    setTimeout(() => {
      window.location.href = paths.entrar;
    }, REDIRECT_DELAY_MS);
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null) {
  clearExpirationTimer();

  if (accessToken) {
    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);

    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server

    if (decodedToken && 'exp' in decodedToken) {
      tokenExpired(decodedToken.exp);
    } else {
      throw new Error('Invalid access token!');
    }
  } else {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
}

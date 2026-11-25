import type { LoginResponse, TokenResponse } from '../types';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/** `POST /auth/login`. Conta com 2FA recebe só o desafio (`mfa_required`), sem token (REQ-15). */
export async function signInWithPassword(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(endpoints.auth.signIn, { email, password });

  return data;
}

/**
 * Segundo passo do login (REQ-15): `mfa_token` + código de 6 dígitos do app autenticador.
 * Só aqui saem o access token e o cookie do refresh.
 */
export async function signInWithTotp(mfaToken: string, code: string): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(endpoints.auth.signInTotp, {
    mfa_token: mfaToken,
    code,
  });

  return data;
}

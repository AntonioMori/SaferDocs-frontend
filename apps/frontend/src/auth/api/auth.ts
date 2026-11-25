import type { LoginResponse } from '../types';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/** `POST /auth/login`. Conta com 2FA recebe só o desafio (`mfa_required`), sem token (REQ-15). */
export async function signInWithPassword(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(endpoints.auth.signIn, { email, password });

  return data;
}

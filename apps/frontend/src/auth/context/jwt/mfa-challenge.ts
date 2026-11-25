import type { MfaRequiredResponse } from '../../types';

// ----------------------------------------------------------------------

/**
 * Desafio do segundo passo do login (REQ-15), guardado só em memória.
 *
 * O `mfa_token` não é um token de acesso: vale só para `POST /auth/login/totp`, uma vez, por
 * poucos minutos. Mesmo assim não vai para storage nem para a URL. Se a página recarregar, ele
 * some e a pessoa volta ao login.
 */
export type MfaChallenge = {
  token: string;
  /** Instante (ms desde a época) em que o desafio deixa de valer. */
  expiresAt: number;
};

let challenge: MfaChallenge | null = null;

export function startMfaChallenge(data: MfaRequiredResponse): void {
  challenge = { token: data.mfa_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

/** O desafio atual, ou `null` se não houver ou se já tiver vencido. */
export function getMfaChallenge(): MfaChallenge | null {
  if (challenge && challenge.expiresAt <= Date.now()) {
    challenge = null;
  }

  return challenge;
}

export function clearMfaChallenge(): void {
  challenge = null;
}

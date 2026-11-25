import type {
  PublicKeyCredentialRequestOptionsJson,
  PublicKeyCredentialCreationOptionsJson,
} from 'src/lib/webauthn';

import axios, { endpoints } from 'src/lib/axios';
import {
  isPasskeySupported,
  PasskeyClientError,
  getPasskeyCredential,
  createPasskeyCredential,
} from 'src/lib/webauthn';

// ----------------------------------------------------------------------

export type PasskeyItem = {
  id: string;
  name: string;
  aaguid: string;
  transports: string[] | null;
  created_at: string;
  last_used_at: string | null;
};

export type PasskeyLoginResult = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
  unseen_security_events?: number;
};

function assertPasskeySupported() {
  if (!isPasskeySupported()) {
    throw new PasskeyClientError(
      'UNSUPPORTED',
      'Este navegador ou dispositivo não oferece suporte a passkeys.'
    );
  }
}

/**
 * Executa a cerimônia completa de cadastro de uma passkey para o usuário autenticado.
 * Erros do navegador saem como `PasskeyClientError`; erros HTTP seguem como `ApiError`.
 */
export async function registerPasskey(name?: string): Promise<PasskeyItem> {
  assertPasskeySupported();

  const { data: options } = await axios.post<PublicKeyCredentialCreationOptionsJson>(
    endpoints.auth.passkeys.registerOptions
  );

  const credential = await createPasskeyCredential(options);
  const normalizedName = name?.trim();

  const { data } = await axios.post<PasskeyItem>(endpoints.auth.passkeys.registerVerify, {
    credential,
    ...(normalizedName ? { name: normalizedName } : {}),
  });

  return data;
}

/**
 * Executa a cerimônia de autenticação por passkey descobrível (sem e-mail prévio).
 * Erros do navegador saem como `PasskeyClientError`; erros HTTP seguem como `ApiError`.
 */
export async function loginWithPasskey(): Promise<PasskeyLoginResult> {
  assertPasskeySupported();

  const { data: options } = await axios.post<PublicKeyCredentialRequestOptionsJson>(
    endpoints.auth.passkeys.loginOptions
  );

  const credential = await getPasskeyCredential(options);

  const { data } = await axios.post<PasskeyLoginResult>(endpoints.auth.passkeys.loginVerify, {
    credential,
  });

  return data;
}

// ----------------------------------------------------------------------

/** Lista as passkeys do próprio usuário (`GET /auth/passkeys`). */
export async function listPasskeys(): Promise<PasskeyItem[]> {
  const { data } = await axios.get<PasskeyItem[]>(endpoints.auth.passkeys.list);

  return data;
}

/** Renomeia uma passkey (`PUT /auth/passkeys/{id}`). */
export async function renamePasskey(id: string, name: string): Promise<PasskeyItem> {
  const { data } = await axios.put<PasskeyItem>(endpoints.auth.passkeys.item(id), { name });

  return data;
}

/** Revoga uma passkey (`DELETE /auth/passkeys/{id}`, 204). */
export async function revokePasskey(id: string): Promise<void> {
  await axios.delete(endpoints.auth.passkeys.item(id));
}

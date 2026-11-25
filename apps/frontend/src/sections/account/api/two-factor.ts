import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type TotpSetup = {
  /** `otpauth://totp/SaferDocs:<email>?secret=...&issuer=SaferDocs`, o conteúdo do QR Code. */
  otpauth_uri: string;
  /** O mesmo segredo em base32, para digitar no app quando não der para ler o QR. */
  secret: string;
};

export type RecoveryCodes = {
  /** Mostrados uma única vez. O backend guarda só o HMAC (REQ-14). */
  recovery_codes: string[];
};

/** `POST /auth/2fa/setup`: gera um segredo pendente. O 2FA só liga depois do `enable`. */
export async function startTotpSetup(): Promise<TotpSetup> {
  const { data } = await axios.post<TotpSetup>(endpoints.auth.twoFactor.setup);

  return data;
}

/** `POST /auth/2fa/enable`: confirma com um código do app e liga o 2FA. */
export async function enableTotp(code: string): Promise<RecoveryCodes> {
  const { data } = await axios.post<RecoveryCodes>(endpoints.auth.twoFactor.enable, { code });

  return data;
}

/** `POST /auth/2fa/disable` (204): exige a senha e um código do app. */
export async function disableTotp(password: string, code: string): Promise<void> {
  await axios.post(endpoints.auth.twoFactor.disable, { password, code });
}

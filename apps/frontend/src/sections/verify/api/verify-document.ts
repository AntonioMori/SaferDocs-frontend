import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type VerifyStatus = 'INTEGRO' | 'ADULTERADO' | 'NAO_ENCONTRADA';

export type VerifyResult = {
  status: VerifyStatus;
  /** Só quando `INTEGRO`. */
  signerName?: string;
  /** ISO 8601 em UTC, só quando `INTEGRO`. */
  signedAt?: string;
  signatureId?: string;
};

const STATUSES: readonly string[] = ['INTEGRO', 'ADULTERADO', 'NAO_ENCONTRADA'];

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined);

/**
 * `POST /verify` (REQ-50 a 54): pública, não precisa de login. O PDF é lido e descartado
 * pelo backend. Erros chegam como `ApiError` (DOC_001 a DOC_004, RATE_001 com `retryAfter`).
 */
export async function verifyDocument(file: File): Promise<VerifyResult> {
  const body = new FormData();
  body.append('file', file);

  const { data } = await axios.post(endpoints.verify, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Não confia no formato: status desconhecido nunca vira um "íntegro" por engano.
  if (!data || typeof data.status !== 'string' || !STATUSES.includes(data.status)) {
    throw new Error('Resposta inesperada da verificação');
  }

  return {
    status: data.status as VerifyStatus,
    signerName: asString(data.signer_name),
    signedAt: asString(data.signed_at),
    signatureId: asString(data.signature_id),
  };
}

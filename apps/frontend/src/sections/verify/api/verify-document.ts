import axios, { endpoints, UPLOAD_TIMEOUT_MS } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type VerifyStatus = 'INTEGRO' | 'ADULTERADO' | 'NAO_ENCONTRADA';

export type VerifySigner = {
  signerName?: string;
  /** ISO 8601 em UTC. */
  signedAt?: string;
  signatureId?: string;
};

export type VerifyResult = VerifySigner & {
  status: VerifyStatus;
  /**
   * Só quando `INTEGRO`: todas as assinaturas do SaferDocs, da primeira para a última. Os campos
   * de cima (`signerName`, `signedAt`, `signatureId`) são os da última.
   */
  signers: VerifySigner[];
};

const STATUSES: readonly string[] = ['INTEGRO', 'ADULTERADO', 'NAO_ENCONTRADA'];

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined);

function asSigner(value: unknown): VerifySigner {
  const item = (value ?? {}) as Record<string, unknown>;
  return {
    signerName: asString(item.signer_name),
    signedAt: asString(item.signed_at),
    signatureId: asString(item.signature_id),
  };
}

/**
 * `POST /verify` (REQ-50 a 54): pública, não precisa de login. O PDF é lido e descartado
 * pelo backend. Erros chegam como `ApiError` (DOC_001 a DOC_004, RATE_001 com `retryAfter`).
 */
export async function verifyDocument(file: File): Promise<VerifyResult> {
  const body = new FormData();
  body.append('file', file);

  const { data } = await axios.post(endpoints.verify, body, {
    timeout: UPLOAD_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Não confia no formato: status desconhecido nunca vira um "íntegro" por engano.
  if (!data || typeof data.status !== 'string' || !STATUSES.includes(data.status)) {
    throw new Error('Resposta inesperada da verificação');
  }

  const latest = asSigner(data);
  const signers = Array.isArray(data.signers) ? data.signers.map(asSigner) : [];

  return {
    status: data.status as VerifyStatus,
    ...latest,
    // Backend antigo, sem `signers`: a única assinatura é a dos campos de cima.
    signers: signers.length > 0 || data.status !== 'INTEGRO' ? signers : [latest],
  };
}

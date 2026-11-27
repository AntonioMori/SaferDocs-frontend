import type { SealPosition } from './seal';

import { sealPositionSchema } from 'src/lib/schemas';
import { ApiError, readBlobApiError } from 'src/lib/api-error';
import axios, { endpoints, UPLOAD_TIMEOUT_MS } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type SignedDocument = {
  /** O PDF assinado, só em memória. */
  blob: Blob;
  /** Id da assinatura (header `X-Signature-Id`), usado depois na verificação. */
  signatureId: string | null;
};

/**
 * `POST /documents/sign` (REQ-46): envia o PDF com a posição do selo e recebe o PDF assinado.
 * Em caso de erro lança `ApiError` (DOC_001 a DOC_006, VAL_001, RATE_001...).
 */
export async function signDocument(file: File, position: SealPosition): Promise<SignedDocument> {
  const parsed = sealPositionSchema.safeParse(position);

  if (!parsed.success) {
    throw new ApiError({
      code: 'VAL_001',
      message: parsed.error.issues[0]?.message ?? 'Posição do selo inválida.',
      status: 0,
    });
  }

  const body = new FormData();
  body.append('file', file);
  body.append('page', String(parsed.data.page));
  body.append('x', String(parsed.data.x));
  body.append('y', String(parsed.data.y));

  try {
    const response = await axios.post<Blob>(endpoints.documents.sign, body, {
      responseType: 'blob',
      timeout: UPLOAD_TIMEOUT_MS,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      blob: response.data,
      signatureId: response.headers['x-signature-id'] ?? null,
    };
  } catch (error) {
    throw await readBlobApiError(error);
  }
}

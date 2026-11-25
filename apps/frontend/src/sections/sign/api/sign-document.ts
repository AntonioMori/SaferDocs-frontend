import type { SealPosition } from './seal';

import axios, { endpoints } from 'src/lib/axios';
import { readBlobApiError } from 'src/lib/api-error';

// ----------------------------------------------------------------------

export type SignedDocument = {
  /** O PDF assinado, só em memória. */
  blob: Blob;
  /** Id da assinatura (header `X-Signature-Id`), usado depois na verificação. */
  signatureId: string | null;
};

/**
 * `POST /documents/sign` (REQ-46): envia o PDF com a posição do selo e recebe o PDF assinado.
 * Em caso de erro lança `ApiError` (DOC_001 a DOC_005, VAL_001, RATE_001...).
 */
export async function signDocument(file: File, position: SealPosition): Promise<SignedDocument> {
  const body = new FormData();
  body.append('file', file);
  body.append('page', String(position.page));
  body.append('x', String(position.x));
  body.append('y', String(position.y));

  try {
    const response = await axios.post<Blob>(endpoints.documents.sign, body, {
      responseType: 'blob',
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

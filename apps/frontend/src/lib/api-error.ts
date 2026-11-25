import { isAxiosError } from 'axios';

// ----------------------------------------------------------------------

/**
 * Erro padronizado da API (RNF-12): `{code, message, timestamp, request_id, fields?}`.
 * O catálogo de códigos fica no README do backend (AUTH_001, VAL_001, DOC_001...).
 */

export type ApiFieldError = {
  /** Nome do campo, com pontos para aninhados (`items.0.name`), igual ao do react-hook-form. */
  field: string;
  reason: string;
};

type ApiErrorBody = {
  code: string;
  message: string;
  timestamp?: string;
  request_id?: string;
  fields?: ApiFieldError[];
};

export const API_ERROR_CODES = {
  /** Sem resposta do servidor (rede fora, CORS, timeout). Só existe no front. */
  network: 'NET_000',
  /** Resposta de erro fora do formato padronizado. Só existe no front. */
  unknown: 'UNKNOWN',
  validation: 'VAL_001',
  /** Arquivo acima do limite (mesmo código do backend). */
  tooLarge: 'DOC_002',
} as const;

const FALLBACK_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';
const NETWORK_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
const TOO_LARGE_MESSAGE = 'O arquivo é grande demais. Envie um PDF menor.';

// ----------------------------------------------------------------------

export class ApiError extends Error {
  readonly code: string;

  /** Status HTTP; 0 quando não houve resposta. */
  readonly status: number;

  readonly requestId?: string;

  readonly timestamp?: string;

  /** Segundos de espera do header `Retry-After` (429), quando o servidor informa. */
  readonly retryAfter?: number;

  readonly fields: ApiFieldError[];

  constructor(init: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    timestamp?: string;
    retryAfter?: number;
    fields?: ApiFieldError[];
    cause?: unknown;
  }) {
    super(init.message, { cause: init.cause });

    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.timestamp = init.timestamp;
    this.retryAfter = init.retryAfter;
    this.fields = init.fields ?? [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// ----------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function parseFields(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) =>
    isRecord(item) && typeof item.field === 'string' && typeof item.reason === 'string'
      ? [{ field: item.field, reason: item.reason }]
      : []
  );
}

/** `Retry-After` em segundos (a API só usa essa forma); data HTTP ou lixo viram `undefined`. */
function parseRetryAfter(value: unknown): number | undefined {
  const seconds = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : NaN;

  return Number.isFinite(seconds) ? seconds : undefined;
}

function parseBody(data: unknown): ApiErrorBody | null {
  if (!isRecord(data) || typeof data.code !== 'string' || typeof data.message !== 'string') {
    return null;
  }

  return {
    code: data.code,
    message: data.message,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
    request_id: typeof data.request_id === 'string' ? data.request_id : undefined,
    fields: parseFields(data.fields),
  };
}

/**
 * Converte qualquer erro lançado por uma chamada HTTP em `ApiError`.
 * O erro original do axios vai em `cause` (útil para repetir a requisição após o refresh).
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body = parseBody(error.response?.data);

    if (body) {
      return new ApiError({
        code: body.code,
        message: body.message,
        status,
        requestId: body.request_id ?? error.response?.headers?.['x-request-id'],
        timestamp: body.timestamp,
        retryAfter: parseRetryAfter(error.response?.headers?.['retry-after']),
        fields: body.fields,
        cause: error,
      });
    }

    // O 413 costuma vir do proxy (nginx), com corpo HTML ou vazio, antes de chegar à API.
    if (status === 413) {
      return new ApiError({
        code: API_ERROR_CODES.tooLarge,
        message: TOO_LARGE_MESSAGE,
        status,
        requestId: error.response?.headers?.['x-request-id'],
        cause: error,
      });
    }

    return new ApiError({
      code: error.response ? API_ERROR_CODES.unknown : API_ERROR_CODES.network,
      message: error.response ? FALLBACK_MESSAGE : NETWORK_MESSAGE,
      status,
      requestId: error.response?.headers?.['x-request-id'],
      retryAfter: parseRetryAfter(error.response?.headers?.['retry-after']),
      cause: error,
    });
  }

  return new ApiError({
    code: API_ERROR_CODES.unknown,
    message: FALLBACK_MESSAGE,
    status: 0,
    cause: error,
  });
}

// ----------------------------------------------------------------------

/**
 * Com `responseType: 'blob'` o corpo do erro também chega como Blob, e o interceptor não
 * consegue ler o JSON. Esta função lê o Blob e reconverte o erro, mantendo `code`, `fields`
 * e `requestId`. Use no `catch` de toda chamada que baixa arquivo.
 */
export async function readBlobApiError(error: unknown): Promise<ApiError> {
  const apiError = toApiError(error);
  const cause = apiError.cause;

  if (!isAxiosError(cause) || !(cause.response?.data instanceof Blob)) return apiError;

  try {
    cause.response.data = JSON.parse(await cause.response.data.text());
  } catch {
    return apiError;
  }

  return toApiError(cause);
}

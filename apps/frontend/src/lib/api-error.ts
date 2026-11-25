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
} as const;

const FALLBACK_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';
const NETWORK_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.';

// ----------------------------------------------------------------------

export class ApiError extends Error {
  readonly code: string;

  /** Status HTTP; 0 quando não houve resposta. */
  readonly status: number;

  readonly requestId?: string;

  readonly timestamp?: string;

  readonly fields: ApiFieldError[];

  constructor(init: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    timestamp?: string;
    fields?: ApiFieldError[];
    cause?: unknown;
  }) {
    super(init.message, { cause: init.cause });

    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.timestamp = init.timestamp;
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
        fields: body.fields,
        cause: error,
      });
    }

    return new ApiError({
      code: error.response ? API_ERROR_CODES.unknown : API_ERROR_CODES.network,
      message: error.response ? FALLBACK_MESSAGE : NETWORK_MESSAGE,
      status,
      requestId: error.response?.headers?.['x-request-id'],
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

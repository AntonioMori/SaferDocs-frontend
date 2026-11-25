import type { ApiError } from 'src/lib/api-error';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type ApiErrorAlertProps = {
  error: ApiError;
  title?: string;
};

/**
 * Mostra um `ApiError` (RNF-12) dentro da página: a mensagem, os campos com problema, o tempo
 * de espera do 429 e o id da requisição para o suporte. Tudo entra como texto, nunca como HTML.
 */
export function ApiErrorAlert({ error, title }: ApiErrorAlertProps) {
  return (
    <Alert severity="error" role="alert">
      {title && <AlertTitle>{title}</AlertTitle>}

      {error.message}

      {error.retryAfter !== undefined && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Tente de novo em {error.retryAfter} {error.retryAfter === 1 ? 'segundo' : 'segundos'}.
        </Typography>
      )}

      {error.fields.length > 0 && (
        <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          {error.fields.map(({ field, reason }) => (
            <li key={`${field}:${reason}`}>
              {field}: {reason}
            </li>
          ))}
        </ul>
      )}

      {error.requestId && (
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.8 }}>
          ID da requisição: {error.requestId}
        </Typography>
      )}
    </Alert>
  );
}

import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { toApiError } from 'src/lib/api-error';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type ApplyOptions = {
  /** Troca o nome do campo da API pelo do formulário (ex.: `current_password` -> `currentPassword`). */
  mapField?: (apiField: string) => string;
};

/**
 * Mostra no toast a mensagem do erro da API (RNF-12), com o `request_id` quando existir
 * para o usuário poder informá-lo ao suporte.
 */
export function showApiError(error: unknown) {
  const { message, requestId } = toApiError(error);

  toast.error(message, requestId ? { description: `ID da requisição: ${requestId}` } : undefined);
}

/**
 * Aplica o `fields` do erro da API nos campos do react-hook-form (RNF-14).
 * Retorna quantos campos receberam erro.
 */
export function setApiFieldErrors<TFieldValues extends FieldValues>(
  methods: Pick<UseFormReturn<TFieldValues>, 'setError'>,
  error: unknown,
  { mapField }: ApplyOptions = {}
): number {
  const { fields } = toApiError(error);

  fields.forEach(({ field, reason }) => {
    const name = (mapField ? mapField(field) : field) as Parameters<typeof methods.setError>[0];

    methods.setError(name, { type: 'server', message: reason });
  });

  return fields.length;
}

/**
 * Uso típico no `catch` do submit: erro de validação vai para o campo certo e
 * qualquer outro erro vira toast. Sem `fields`, mostra a mensagem no toast também.
 */
export function handleApiFormError<TFieldValues extends FieldValues>(
  methods: Pick<UseFormReturn<TFieldValues>, 'setError'>,
  error: unknown,
  options?: ApplyOptions
) {
  const applied = setApiFieldErrors(methods, error, options);

  if (applied === 0) {
    showApiError(error);
  }
}

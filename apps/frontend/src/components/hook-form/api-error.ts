import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { get } from 'react-hook-form';

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

/** O campo existe no formulário? Sem valor (nem `''`) nos valores atuais, ninguém exibiria o erro. */
function isRegistered<TFieldValues extends FieldValues>(
  methods: Pick<UseFormReturn<TFieldValues>, 'getValues'>,
  name: string
) {
  return get(methods.getValues(), name) !== undefined;
}

/**
 * Aplica o `fields` do erro da API nos campos do react-hook-form (RNF-14).
 * Retorna quantos campos receberam erro; os que não existem no formulário ficam de fora.
 */
export function setApiFieldErrors<TFieldValues extends FieldValues>(
  methods: Pick<UseFormReturn<TFieldValues>, 'setError' | 'getValues'>,
  error: unknown,
  { mapField }: ApplyOptions = {}
): number {
  const { fields } = toApiError(error);
  let applied = 0;

  fields.forEach(({ field, reason }) => {
    const mapped = mapField ? mapField(field) : field;

    if (!isRegistered(methods, mapped)) return;

    methods.setError(mapped as Parameters<typeof methods.setError>[0], {
      type: 'server',
      message: reason,
    });
    applied += 1;
  });

  return applied;
}

/**
 * Uso típico no `catch` do submit: erro de validação vai para o campo certo e
 * qualquer outro erro vira toast. Se algum erro de campo não encontrou campo no formulário
 * (ou não veio `fields`), a mensagem também vai para o toast em vez de ser engolida.
 */
export function handleApiFormError<TFieldValues extends FieldValues>(
  methods: Pick<UseFormReturn<TFieldValues>, 'setError' | 'getValues'>,
  error: unknown,
  options?: ApplyOptions
) {
  const applied = setApiFieldErrors(methods, error, options);

  if (applied < toApiError(error).fields.length || applied === 0) {
    showApiError(error);
  }
}

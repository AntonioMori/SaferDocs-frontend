import type { RHFTextFieldProps } from 'src/components/hook-form/rhf-text-field';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Campo do código de 6 dígitos do app autenticador: teclado numérico no celular e
 * `autocomplete="one-time-code"` para o navegador sugerir o código.
 */
export function TotpCodeField({
  name = 'code',
  label = 'Código do app autenticador',
  slotProps,
  ...other
}: Partial<RHFTextFieldProps>) {
  return (
    <Field.Text
      name={name}
      label={label}
      placeholder="000000"
      autoComplete="one-time-code"
      slotProps={{
        ...slotProps,
        inputLabel: { shrink: true, ...slotProps?.inputLabel },
        htmlInput: {
          inputMode: 'numeric',
          maxLength: 7,
          style: { letterSpacing: 8, fontSize: 22, textAlign: 'center' },
          ...slotProps?.htmlInput,
        },
      }}
      {...other}
    />
  );
}

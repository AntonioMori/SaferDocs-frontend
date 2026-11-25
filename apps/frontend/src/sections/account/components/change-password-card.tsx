import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { newPasswordSchema } from 'src/lib/password-policy';

import { Iconify } from 'src/components/iconify';
import { PasswordRules } from 'src/components/password-rules';
import { Form, Field, handleApiFormError } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { changePassword } from '../api/account';

// ----------------------------------------------------------------------

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'Informe a senha atual.' }),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, { error: 'Repita a nova senha.' }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: 'As senhas não são iguais.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: 'A nova senha precisa ser diferente da atual.',
    path: ['newPassword'],
  });

type ChangePasswordInput = z.input<typeof ChangePasswordSchema>;
type ChangePasswordOutput = z.output<typeof ChangePasswordSchema>;

const EMPTY: ChangePasswordInput = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Campos da API (`current_password`, `new_password`) -> campos do formulário. */
const API_FIELDS: Record<string, keyof ChangePasswordInput> = {
  current_password: 'currentPassword',
  new_password: 'newPassword',
};

// ----------------------------------------------------------------------

/**
 * Troca de senha (REQ-25): senha atual + nova senha com a política do REQ-01. O backend encerra
 * todas as sessões anteriores (inclusive o access em uso) e devolve um par novo para esta aba,
 * que continua logada.
 */
export function ChangePasswordCard() {
  const { signIn } = useAuthContext();
  const showPassword = useBoolean();

  const [done, setDone] = useState(false);

  const methods = useForm<ChangePasswordInput, unknown, ChangePasswordOutput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);

    try {
      const data = await changePassword(values.currentPassword, values.newPassword);

      // O access antigo foi para a denylist: a aba segue com o par novo.
      signIn(data);
      reset(EMPTY);
      setDone(true);
    } catch (error) {
      handleApiFormError(methods, error, { mapField: (field) => API_FIELDS[field] ?? field });
    }
  });

  const type = showPassword.value ? 'text' : 'password';

  const visibility = (
    <InputAdornment position="end">
      <IconButton
        onClick={showPassword.onToggle}
        edge="end"
        aria-label={showPassword.value ? 'Ocultar senhas' : 'Mostrar senhas'}
      >
        <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <Card>
      <CardHeader
        title="Senha"
        subheader="Ao trocar a senha, todas as outras sessões da conta são encerradas."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column', maxWidth: 480 }}>
          {done && (
            <Alert severity="success" onClose={() => setDone(false)}>
              Senha alterada. As outras sessões da sua conta foram encerradas: nos outros
              dispositivos será preciso entrar de novo com a nova senha.
            </Alert>
          )}

          <Field.Text
            name="currentPassword"
            label="Senha atual"
            type={type}
            autoComplete="current-password"
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: visibility } }}
          />

          <Field.Text
            name="newPassword"
            label="Nova senha"
            type={type}
            autoComplete="new-password"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <PasswordRules password={newPassword ?? ''} sx={{ mt: -1.5 }} />

          <Field.Text
            name="confirmPassword"
            label="Repita a nova senha"
            type={type}
            autoComplete="new-password"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              Trocar senha
            </Button>
          </Box>
        </Box>
      </Form>
    </Card>
  );
}

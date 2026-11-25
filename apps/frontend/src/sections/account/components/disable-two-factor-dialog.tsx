import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { totpCodeSchema } from 'src/lib/schemas';

import { Form, Field, handleApiFormError } from 'src/components/hook-form';

import { TotpCodeField } from 'src/auth/components/totp-code-field';

import { disableTotp } from '../api/two-factor';

// ----------------------------------------------------------------------

const DisableSchema = z.object({
  password: z.string().min(1, { error: 'Informe a senha.' }),
  code: totpCodeSchema,
});

type DisableInput = z.input<typeof DisableSchema>;
type DisableOutput = z.output<typeof DisableSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onDisabled: () => void;
};

/** Desativar o 2FA (REQ-13): exige a senha e um código válido do app. */
export function DisableTwoFactorDialog({ open, onClose, onDisabled }: Props) {
  const methods = useForm<DisableInput, unknown, DisableOutput>({
    resolver: zodResolver(DisableSchema),
    defaultValues: { password: '', code: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset({ password: '', code: '' });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await disableTotp(values.password, values.code);
      onDisabled();
    } catch (error) {
      handleApiFormError(methods, error);
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={isSubmitting ? undefined : onClose}>
      <DialogTitle>Desativar verificação em duas etapas</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={3}>
            <Alert severity="warning">
              Sem o segundo passo, quem descobrir sua senha consegue entrar na conta. Os códigos
              de recuperação atuais deixam de valer.
            </Alert>

            <Field.Text
              name="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TotpCodeField disabled={isSubmitting} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="error" loading={isSubmitting}>
            Desativar
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

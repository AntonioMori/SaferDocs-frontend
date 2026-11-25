import type { PasskeyItem } from '../api/passkeys';

import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { optionalPasskeyNameSchema } from 'src/lib/schemas';
import { isPasskeySupported, isPasskeyClientError } from 'src/lib/webauthn';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { handleApiFormError } from 'src/components/hook-form/api-error';

import { registerPasskey } from '../api/passkeys';

// ----------------------------------------------------------------------

const RegisterPasskeySchema = z.object({ name: optionalPasskeyNameSchema });

type RegisterPasskeyFormValues = z.infer<typeof RegisterPasskeySchema>;

type RegisterPasskeyDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (passkey: PasskeyItem) => void;
};

export function RegisterPasskeyDialog({
  open,
  onClose,
  onSuccess,
}: RegisterPasskeyDialogProps) {
  const supported = isPasskeySupported();
  const [clientError, setClientError] = useState<string | null>(null);

  const methods = useForm<RegisterPasskeyFormValues>({
    resolver: zodResolver(RegisterPasskeySchema),
    defaultValues: { name: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleClose = () => {
    if (isSubmitting) return;
    setClientError(null);
    reset({ name: '' });
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setClientError(null);

    try {
      const created = await registerPasskey(values.name || undefined);
      toast.success(`Passkey "${created.name}" cadastrada com sucesso.`);
      reset({ name: '' });
      onSuccess?.(created);
      onClose();
    } catch (error) {
      if (isPasskeyClientError(error)) {
        setClientError(error.message);
        toast.error(error.message);
        return;
      }

      handleApiFormError(methods, error);
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={handleClose}>
      <DialogTitle>Cadastrar passkey</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Use a biometria, PIN ou chave de segurança deste dispositivo para entrar sem digitar
              sua senha.
            </Typography>

            {!supported && (
              <Alert severity="warning">
                Este navegador ou dispositivo não oferece suporte a passkeys (WebAuthn).
              </Alert>
            )}

            {clientError && (
              <Alert severity="error" role="alert">
                {clientError}
              </Alert>
            )}

            <Field.Text
              name="name"
              label="Nome amigável (opcional)"
              placeholder="Ex.: Notebook do trabalho"
              helperText="Até 60 caracteres. Se ficar em branco, será salva como Passkey."
              disabled={isSubmitting || !supported}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!supported}
          >
            Cadastrar passkey
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

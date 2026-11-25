import type { PasskeyItem } from '../api/passkeys';

import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { handleApiFormError } from 'src/components/hook-form/api-error';

import { renamePasskey } from '../api/passkeys';

// ----------------------------------------------------------------------

const RenamePasskeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe um nome para a passkey.')
    .max(60, 'O nome da passkey deve ter no máximo 60 caracteres.'),
});

type RenamePasskeyValues = z.infer<typeof RenamePasskeySchema>;

type Props = {
  passkey: PasskeyItem | null;
  onClose: () => void;
  onRenamed: (passkey: PasskeyItem) => void;
};

export function RenamePasskeyDialog({ passkey, onClose, onRenamed }: Props) {
  const methods = useForm<RenamePasskeyValues>({
    resolver: zodResolver(RenamePasskeySchema),
    defaultValues: { name: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (passkey) reset({ name: passkey.name });
  }, [passkey, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!passkey) return;

    try {
      const updated = await renamePasskey(passkey.id, values.name);
      toast.success('Passkey renomeada.');
      onRenamed(updated);
      onClose();
    } catch (error) {
      handleApiFormError(methods, error);
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={!!passkey} onClose={isSubmitting ? undefined : onClose}>
      <DialogTitle>Renomear passkey</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Field.Text
            name="name"
            label="Nome"
            helperText="De 1 a 60 caracteres."
            disabled={isSubmitting}
            autoFocus
          />
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Salvar
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

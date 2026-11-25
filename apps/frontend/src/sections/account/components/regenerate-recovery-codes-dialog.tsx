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

import { Form, handleApiFormError } from 'src/components/hook-form';

import { TotpCodeField } from 'src/auth/components/totp-code-field';

import { regenerateRecoveryCodes } from '../api/two-factor';

// ----------------------------------------------------------------------

const RegenerateSchema = z.object({ code: totpCodeSchema });

type RegenerateInput = z.input<typeof RegenerateSchema>;
type RegenerateOutput = z.output<typeof RegenerateSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onRegenerated: (codes: string[]) => void;
};

/** Gerar novos códigos de recuperação (REQ-14): confirma com um código do app. */
export function RegenerateRecoveryCodesDialog({ open, onClose, onRegenerated }: Props) {
  const methods = useForm<RegenerateInput, unknown, RegenerateOutput>({
    resolver: zodResolver(RegenerateSchema),
    defaultValues: { code: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset({ code: '' });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { recovery_codes } = await regenerateRecoveryCodes(values.code);
      onRegenerated(recovery_codes);
    } catch (error) {
      handleApiFormError(methods, error);
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={isSubmitting ? undefined : onClose}>
      <DialogTitle>Gerar novos códigos de recuperação</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={3}>
            <Alert severity="info">
              Os códigos atuais deixam de valer, inclusive os que você ainda não usou.
            </Alert>

            <TotpCodeField disabled={isSubmitting} autoFocus />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Gerar novos códigos
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

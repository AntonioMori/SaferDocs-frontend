import type { PasskeyItem } from '../api/passkeys';

import { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { isApiError } from 'src/lib/api-error';

import { toast } from 'src/components/snackbar';
import { showApiError } from 'src/components/hook-form/api-error';

import { revokePasskey } from '../api/passkeys';

// ----------------------------------------------------------------------

type Props = {
  passkey: PasskeyItem | null;
  onClose: () => void;
  onRevoked: (passkey: PasskeyItem) => void;
  /** A passkey não existe mais no servidor (404). */
  onGone?: (passkey: PasskeyItem) => void;
};

export function RevokePasskeyDialog({ passkey, onClose, onRevoked, onGone }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!passkey) return;

    setSubmitting(true);

    try {
      await revokePasskey(passkey.id);
      toast.success('Passkey revogada.');
      onRevoked(passkey);
      onClose();
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        toast.warning('Esta passkey já não existe. A lista foi atualizada.');
        onGone?.(passkey);
        onClose();
        return;
      }

      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={!!passkey} onClose={submitting ? undefined : onClose}>
      <DialogTitle>Revogar passkey</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {/* O nome vem do servidor: o React o renderiza sempre como texto. */}
          Revogar a passkey &quot;{passkey?.name}&quot;? Ela deixa de funcionar para entrar na
          conta. Para usar este dispositivo de novo, será preciso cadastrá-lo outra vez.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" loading={submitting} onClick={handleConfirm}>
          Revogar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

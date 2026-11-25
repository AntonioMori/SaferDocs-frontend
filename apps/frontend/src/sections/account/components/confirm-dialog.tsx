import type { ButtonProps } from '@mui/material/Button';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  title: React.ReactNode;
  content: React.ReactNode;
  confirmLabel: string;
  confirmColor?: ButtonProps['color'];
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirmação de uma ação que não dá para desfazer. */
export function ConfirmDialog({
  open,
  title,
  content,
  confirmLabel,
  confirmColor = 'error',
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

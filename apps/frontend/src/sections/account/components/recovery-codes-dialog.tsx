import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  /** Códigos mostrados uma única vez. `null` fecha o diálogo. */
  codes: string[] | null;
  onClose: () => void;
};

/**
 * Códigos de recuperação recém-gerados. Ficam só no estado deste diálogo: ao fechar, somem da
 * memória e o servidor só guarda o HMAC deles.
 */
export function RecoveryCodesDialog({ codes, onClose }: Props) {
  return (
    <Dialog fullWidth maxWidth="xs" open={!!codes} onClose={onClose}>
      <DialogTitle>Códigos de recuperação</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Guarde estes códigos em lugar seguro. Cada um entra uma vez no lugar do código do app,
          se você perder o celular. Eles não serão mostrados de novo.
        </Alert>

        <Box
          component="ol"
          aria-label="Códigos de recuperação"
          sx={{
            m: 0,
            p: 2,
            gap: 1,
            display: 'grid',
            listStyle: 'none',
            borderRadius: 1.5,
            fontFamily: 'monospace',
            fontSize: 16,
            textAlign: 'center',
            gridTemplateColumns: 'repeat(2, 1fr)',
            bgcolor: 'background.neutral',
          }}
        >
          {codes?.map((code) => (
            <li key={code} data-testid="recovery-code">
              {code}
            </li>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

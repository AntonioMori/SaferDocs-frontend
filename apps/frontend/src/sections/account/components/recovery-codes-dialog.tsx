import { useState, useEffect } from 'react';
import { useCopyToClipboard } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { downloadBlob } from 'src/utils/download-file';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  /** Códigos mostrados uma única vez. `null` fecha o diálogo. */
  codes: string[] | null;
  onClose: () => void;
};

function codesAsText(codes: string[], email: string | undefined) {
  return [
    'SaferDocs: códigos de recuperação da verificação em duas etapas',
    email ? `Conta: ${email}` : null,
    `Gerados em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    'Cada código vale uma única vez, no lugar do código do app autenticador.',
    'Guarde este arquivo em lugar seguro, fora do celular.',
    '',
    ...codes,
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Códigos de recuperação recém-gerados (REQ-14). Ficam só no estado deste diálogo e nunca em
 * storage: ao fechar, somem da memória, e o servidor guarda só o HMAC deles. Para fechar, a
 * pessoa confirma que guardou (copiando, baixando o .txt ou anotando).
 */
export function RecoveryCodesDialog({ codes, onClose }: Props) {
  const { user } = useAuthContext();
  const { copy } = useCopyToClipboard();

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (codes) setSaved(false);
  }, [codes]);

  const handleCopy = async () => {
    if (codes && (await copy(codes.join('\n')))) toast.success('Códigos copiados.');
  };

  const handleDownload = () => {
    if (!codes) return;

    downloadBlob(
      new Blob([codesAsText(codes, user?.email)], { type: 'text/plain;charset=utf-8' }),
      'saferdocs-codigos-de-recuperacao.txt'
    );
  };

  return (
    // Sem `onClose`: não fecha pelo fundo nem pelo Esc, porque os códigos não aparecem de novo.
    <Dialog fullWidth maxWidth="xs" open={!!codes}>
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

        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={handleCopy}
            startIcon={<Iconify icon="solar:copy-bold" />}
          >
            Copiar
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={handleDownload}
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            Baixar .txt
          </Button>
        </Stack>

        <FormControlLabel
          sx={{ mt: 2 }}
          control={<Checkbox checked={saved} onChange={(event) => setSaved(event.target.checked)} />}
          label="Guardei os códigos em lugar seguro"
        />
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose} disabled={!saved}>
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

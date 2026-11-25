import type { TotpSetup } from '../api/two-factor';

import * as z from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCopyToClipboard } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { toApiError } from 'src/lib/api-error';
import { totpCodeSchema } from 'src/lib/schemas';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, handleApiFormError } from 'src/components/hook-form';

import { TotpCodeField } from 'src/auth/components/totp-code-field';

import { enableTotp, startTotpSetup } from '../api/two-factor';

// ----------------------------------------------------------------------

const EnableSchema = z.object({ code: totpCodeSchema });

type EnableInput = z.input<typeof EnableSchema>;
type EnableOutput = z.output<typeof EnableSchema>;

/** `ABCD EFGH IJKL ...`: mais fácil de digitar no app quando não der para ler o QR. */
const groupSecret = (secret: string) => secret.match(/.{1,4}/g)?.join(' ') ?? secret;

type Props = {
  open: boolean;
  onClose: () => void;
  /** 2FA ligado. Recebe os códigos de recuperação, que só existem nesta resposta. */
  onEnabled: (recoveryCodes: string[]) => void;
};

/**
 * Ativação do 2FA (REQ-13): o QR Code é gerado no próprio navegador a partir da URI `otpauth://`
 * (nada vai para serviço externo) e a ativação só conclui com um código válido do app.
 */
export function EnableTwoFactorDialog({ open, onClose, onEnabled }: Props) {
  const { copy } = useCopyToClipboard();

  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const methods = useForm<EnableInput, unknown, EnableOutput>({
    resolver: zodResolver(EnableSchema),
    defaultValues: { code: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Cada abertura gera um segredo novo (o pendente anterior deixa de valer).
  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    setSetup(null);
    setLoadError(null);
    setShowSecret(false);
    reset({ code: '' });

    startTotpSetup()
      .then((data) => active && setSetup(data))
      .catch((error) => active && setLoadError(toApiError(error).message));

    return () => {
      active = false;
    };
  }, [open, reset]);

  const handleClose = () => {
    // O segredo some da memória ao fechar.
    setSetup(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { recovery_codes } = await enableTotp(values.code);

      setSetup(null);
      onEnabled(recovery_codes);
    } catch (error) {
      handleApiFormError(methods, error);
    }
  });

  const handleCopySecret = async () => {
    if (setup && (await copy(setup.secret))) toast.success('Chave copiada.');
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={isSubmitting ? undefined : handleClose}>
      <DialogTitle>Ativar verificação em duas etapas</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {loadError && <Alert severity="error">{loadError}</Alert>}

          {!setup && !loadError && (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress aria-label="Gerando o QR Code" />
            </Box>
          )}

          {setup && (
            <Stack spacing={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                1. No celular, abra o Google Authenticator, Authy ou outro app autenticador e leia
                o QR Code abaixo.
              </Typography>

              <Box
                sx={{
                  p: 2,
                  mx: 'auto',
                  borderRadius: 1.5,
                  bgcolor: 'common.white',
                  display: 'inline-flex',
                  border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                }}
              >
                <QRCodeSVG
                  value={setup.otpauth_uri}
                  size={200}
                  level="M"
                  role="img"
                  aria-label="QR Code para cadastrar o SaferDocs no app autenticador"
                />
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                {showSecret ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                      data-testid="totp-secret"
                      sx={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: 1, wordBreak: 'break-all' }}
                    >
                      {groupSecret(setup.secret)}
                    </Typography>
                    <Tooltip title="Copiar chave">
                      <IconButton onClick={handleCopySecret} aria-label="Copiar chave">
                        <Iconify icon="solar:copy-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : (
                  <Button size="small" color="inherit" onClick={() => setShowSecret(true)}>
                    Não consigo ler o QR Code
                  </Button>
                )}
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                2. Digite o código de 6 dígitos que o app mostrar para o SaferDocs.
              </Typography>

              <TotpCodeField disabled={isSubmitting} />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting} disabled={!setup}>
            Ativar
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

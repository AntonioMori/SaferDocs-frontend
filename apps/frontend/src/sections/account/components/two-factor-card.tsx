import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { RecoveryCodesDialog } from './recovery-codes-dialog';
import { EnableTwoFactorDialog } from './enable-two-factor-dialog';
import { DisableTwoFactorDialog } from './disable-two-factor-dialog';
import { RegenerateRecoveryCodesDialog } from './regenerate-recovery-codes-dialog';

// ----------------------------------------------------------------------

/** Verificação em duas etapas (REQ-13): estado atual, ativar com QR Code e desativar. */
export function TwoFactorCard() {
  const { user, updateUser } = useAuthContext();
  const enabled = !!user?.totp_enabled;

  const enableDialog = useBoolean();
  const disableDialog = useBoolean();
  const regenerateDialog = useBoolean();
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const handleEnabled = (codes: string[]) => {
    enableDialog.onFalse();
    updateUser({ totp_enabled: true });
    toast.success('Verificação em duas etapas ativada.');
    setRecoveryCodes(codes);
  };

  const handleRegenerated = (codes: string[]) => {
    regenerateDialog.onFalse();
    toast.success('Novos códigos gerados. Os anteriores não valem mais.');
    setRecoveryCodes(codes);
  };

  const handleDisabled = () => {
    disableDialog.onFalse();
    updateUser({ totp_enabled: false });
    toast.success('Verificação em duas etapas desativada.');
  };

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <span>Verificação em duas etapas</span>
            <Label color={enabled ? 'success' : 'default'} data-testid="totp-status">
              {enabled ? 'Ativa' : 'Desativada'}
            </Label>
          </Stack>
        }
        subheader="Além da senha, o login pede um código do app autenticador do seu celular (TOTP)."
      />

      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', maxWidth: 640 }}>
          {enabled
            ? 'Ao entrar com e-mail e senha, você também digita o código de 6 dígitos do app. Se perder o celular, use um código de recuperação.'
            : 'Funciona com Google Authenticator, Authy, Microsoft Authenticator e outros apps compatíveis.'}
        </Typography>

        {enabled ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={regenerateDialog.onTrue}
              startIcon={<Iconify icon="solar:restart-bold" />}
            >
              Gerar novos códigos de recuperação
            </Button>
            <Button variant="outlined" color="error" onClick={disableDialog.onTrue}>
              Desativar
            </Button>
          </Stack>
        ) : (
          <Button
            color="primary"
            variant="contained"
            onClick={enableDialog.onTrue}
            startIcon={<Iconify icon="solar:shield-check-bold" />}
          >
            Ativar
          </Button>
        )}
      </Box>

      <EnableTwoFactorDialog
        open={enableDialog.value}
        onClose={enableDialog.onFalse}
        onEnabled={handleEnabled}
      />

      <DisableTwoFactorDialog
        open={disableDialog.value}
        onClose={disableDialog.onFalse}
        onDisabled={handleDisabled}
      />

      <RegenerateRecoveryCodesDialog
        open={regenerateDialog.value}
        onClose={regenerateDialog.onFalse}
        onRegenerated={handleRegenerated}
      />

      <RecoveryCodesDialog codes={recoveryCodes} onClose={() => setRecoveryCodes(null)} />
    </Card>
  );
}

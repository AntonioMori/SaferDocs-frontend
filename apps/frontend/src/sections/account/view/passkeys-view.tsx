import type { PasskeyItem } from '../api/passkeys';

import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { isPasskeySupported } from 'src/lib/webauthn';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { RegisterPasskeyDialog } from '../components/register-passkey-dialog';

// ----------------------------------------------------------------------

export function PasskeysView() {
  const supported = isPasskeySupported();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<PasskeyItem | null>(null);

  return (
    <DashboardContent maxWidth="md">
      <Stack
        direction="row"
        sx={{ mb: 3, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h4">Passkeys</Typography>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          disabled={!supported}
          onClick={() => setDialogOpen(true)}
        >
          Cadastrar passkey
        </Button>
      </Stack>

      <Stack spacing={2}>
        <Typography sx={{ color: 'text.secondary' }}>
          Entre na sua conta com biometria, PIN do dispositivo ou chave de segurança, sem digitar
          a senha.
        </Typography>

        {!supported && (
          <Alert severity="warning">
            Este navegador não oferece suporte a passkeys (WebAuthn). Use um navegador moderno em
            conexão segura (HTTPS ou localhost).
          </Alert>
        )}

        {lastRegistered && (
          <Alert severity="success">Passkey &quot;{lastRegistered.name}&quot; cadastrada.</Alert>
        )}
      </Stack>

      <RegisterPasskeyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={setLastRegistered}
      />
    </DashboardContent>
  );
}

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { TwoFactorCard } from '../components/two-factor-card';
import { ChangePasswordCard } from '../components/change-password-card';

// ----------------------------------------------------------------------

/** Segurança da conta: senha, verificação em duas etapas e atividade de segurança. */
export function SegurancaView() {
  return (
    <DashboardContent maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Segurança da conta
      </Typography>
      <Typography sx={{ mb: 4, color: 'text.secondary' }}>
        Senha, verificação em duas etapas e o histórico de eventos de segurança da sua conta.
      </Typography>

      <Stack spacing={3}>
        <TwoFactorCard />
        <ChangePasswordCard />
      </Stack>
    </DashboardContent>
  );
}

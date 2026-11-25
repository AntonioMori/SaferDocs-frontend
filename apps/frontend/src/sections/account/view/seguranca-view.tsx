import { DashboardContent } from 'src/layouts/dashboard';

import { PageStub } from 'src/components/page-stub';

// ----------------------------------------------------------------------

export function SegurancaView() {
  return (
    <DashboardContent maxWidth="xl">
      <PageStub
        title="Segurança da conta"
        description="2FA, troca de senha e atividade de segurança."
      />
    </DashboardContent>
  );
}

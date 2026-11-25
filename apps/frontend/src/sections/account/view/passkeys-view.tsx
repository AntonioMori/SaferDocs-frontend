import { DashboardContent } from 'src/layouts/dashboard';

import { PageStub } from 'src/components/page-stub';

// ----------------------------------------------------------------------

export function PasskeysView() {
  return (
    <DashboardContent maxWidth="xl">
      <PageStub title="Passkeys" description="Gerenciamento de passkeys (REQ-10)." />
    </DashboardContent>
  );
}

import { DashboardContent } from 'src/layouts/dashboard';

import { PageStub } from 'src/components/page-stub';

// ----------------------------------------------------------------------

export function SessoesView() {
  return (
    <DashboardContent maxWidth="xl">
      <PageStub title="Sessões ativas" description="Lista e revogação de sessões (REQ-57)." />
    </DashboardContent>
  );
}

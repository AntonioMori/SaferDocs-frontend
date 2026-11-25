import { DashboardContent } from 'src/layouts/dashboard';

import { PageStub } from 'src/components/page-stub';

// ----------------------------------------------------------------------

export function AssinarView() {
  return (
    <DashboardContent maxWidth="xl">
      <PageStub
        title="Assinar documento"
        description="Upload do PDF, posição do selo e download do documento assinado (REQ-46)."
      />
    </DashboardContent>
  );
}

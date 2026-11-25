import Container from '@mui/material/Container';

import { PageStub } from 'src/components/page-stub';

// ----------------------------------------------------------------------

export function VerificarView() {
  return (
    <Container sx={{ py: 5 }}>
      <PageStub
        title="Verificar documento"
        description="Página pública: confere a integridade de um PDF assinado (REQ-52)."
      />
    </Container>
  );
}

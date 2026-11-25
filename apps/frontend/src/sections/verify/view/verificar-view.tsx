import type { ApiError } from 'src/lib/api-error';
import type { VerifyResult } from '../api/verify-document';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { toApiError } from 'src/lib/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { PdfUpload } from 'src/components/pdf-upload';
import { ApiErrorAlert } from 'src/components/api-error-alert';

import { useAuthContext } from 'src/auth/hooks';

import { verifyDocument } from '../api/verify-document';
import { VerifyResultCard } from './verify-result-card';

// ----------------------------------------------------------------------

export function VerificarView() {
  const { authenticated } = useAuthContext();
  const [file, setFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setResult(null);
    setError(null);
  };

  const handleVerify = async () => {
    if (!file) return;

    setResult(null);
    setError(null);
    setVerifying(true);

    try {
      setResult(await verifyDocument(file));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setVerifying(false);
    }
  };

  // Logado, a página fica dentro do painel: usa o mesmo contêiner de /assinar, para
  // as duas terem o mesmo alinhamento. Sem login, é a página pública com respiro próprio.
  const Wrapper = authenticated ? DashboardContent : PublicContainer;

  return (
    <Wrapper maxWidth="md">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Verificar documento
      </Typography>
      <Typography sx={{ mb: 4, color: 'text.secondary' }}>
        Envie um PDF para saber se ele foi assinado no SaferDocs e se continua igual ao original.
        Não precisa de conta, e o arquivo não é guardado.
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <PdfUpload value={file} onChange={handleFileChange} disabled={verifying} />

          {error && <ApiErrorAlert error={error} title="Não foi possível verificar" />}

          {result && <VerifyResultCard result={result} />}

          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              disabled={!file}
              loading={verifying}
              onClick={handleVerify}
              startIcon={<Iconify icon="solar:shield-check-bold" />}
            >
              Verificar documento
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Wrapper>
  );
}

function PublicContainer({ children, maxWidth }: { children: React.ReactNode; maxWidth: 'md' }) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: 5 }}>
      {children}
    </Container>
  );
}

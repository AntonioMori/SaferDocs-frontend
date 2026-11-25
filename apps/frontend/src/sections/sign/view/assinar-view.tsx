import type { SealPosition } from '../api/seal';
import type { ApiError } from 'src/lib/api-error';
import type { SignedDocument } from '../api/sign-document';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { downloadBlob, signedFilename } from 'src/utils/download-file';

import { toApiError } from 'src/lib/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { PdfUpload } from 'src/components/pdf-upload';
import { ApiErrorAlert } from 'src/components/api-error-alert';

import { signDocument } from '../api/sign-document';
import { DEFAULT_SEAL_POSITION } from '../api/seal';
import { SealPositionPicker } from '../components/seal-position-picker';

// ----------------------------------------------------------------------

export function AssinarView() {
  const [file, setFile] = useState<File | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [signed, setSigned] = useState<SignedDocument | null>(null);

  const [position, setPosition] = useState<SealPosition>(DEFAULT_SEAL_POSITION);
  const [sealFits, setSealFits] = useState(true);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setPosition(DEFAULT_SEAL_POSITION);
    setError(null);
    setSigned(null);
  };

  const handleSign = async () => {
    if (!file) return;

    setError(null);
    setSigning(true);

    try {
      const result = await signDocument(file, position);

      setSigned(result);
      downloadBlob(result.blob, signedFilename(file.name));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadAgain = () => {
    if (file && signed) downloadBlob(signed.blob, signedFilename(file.name));
  };

  return (
    <DashboardContent maxWidth="md">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Assinar documento
      </Typography>
      <Typography sx={{ mb: 4, color: 'text.secondary' }}>
        Envie um PDF e receba o documento assinado, com o selo visível e a assinatura digital
        embutida. O arquivo não fica guardado no navegador.
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <PdfUpload value={file} onChange={handleFileChange} disabled={signing} />

          {file && (
            <SealPositionPicker
              file={file}
              value={position}
              onChange={(next) => {
                setPosition(next);
                setSigned(null);
              }}
              onFitChange={setSealFits}
              disabled={signing}
            />
          )}

          {error && <ApiErrorAlert error={error} title="Não foi possível assinar" />}

          {signed && (
            <Alert
              severity="success"
              action={
                <Button color="inherit" size="small" onClick={handleDownloadAgain}>
                  Baixar de novo
                </Button>
              }
            >
              Documento assinado e baixado.
              {signed.signatureId && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Id da assinatura: {signed.signatureId}
                </Typography>
              )}
            </Alert>
          )}

          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              disabled={!file || !sealFits || !!signed}
              loading={signing}
              onClick={handleSign}
              startIcon={<Iconify icon="solar:shield-check-bold" />}
            >
              Assinar documento
            </Button>
          </Stack>
        </Stack>
      </Card>
    </DashboardContent>
  );
}

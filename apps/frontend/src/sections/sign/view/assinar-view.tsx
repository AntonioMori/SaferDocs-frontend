import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { PdfUpload } from 'src/components/pdf-upload';

// ----------------------------------------------------------------------

export function AssinarView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);

  return (
    <DashboardContent maxWidth="md">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Assinar documento
      </Typography>
      <Typography sx={{ mb: 4, color: 'text.secondary' }}>
        Escolha o PDF que você quer assinar. Ele é conferido no seu navegador antes de qualquer
        envio.
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <PdfUpload
            value={file}
            onChange={(next, info) => {
              setFile(next);
              setPageCount(info?.pageCount ?? 0);
            }}
          />

          {file && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              PDF válido, com {pageCount} {pageCount === 1 ? 'página' : 'páginas'}.
            </Typography>
          )}
        </Stack>
      </Card>
    </DashboardContent>
  );
}

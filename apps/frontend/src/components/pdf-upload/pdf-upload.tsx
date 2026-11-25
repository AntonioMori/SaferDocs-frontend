import type { FileRejection } from 'react-dropzone';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { fData } from 'src/utils/format-number';

import { UploadIllustration } from 'src/assets/illustrations';
import { MAX_PDF_MB, validatePdfFile } from 'src/lib/pdf/validate-pdf';

import { Upload } from '../upload';
import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

export type PdfUploadProps = {
  /** PDF já aceito pela validação, ou `null`. */
  value: File | null;
  /** Chamado com o arquivo aprovado (e o número de páginas) ou com `null` ao remover. */
  onChange: (file: File | null, info?: { pageCount: number }) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
};

/**
 * Upload de um PDF com a validação prévia do REQ-61: tamanho, extensão ou tipo, `%PDF-` e
 * abertura no pdf.js, tudo antes de qualquer envio. O arquivo só fica em memória.
 */
export function PdfUpload({
  value,
  onChange,
  disabled,
  title = 'Solte o PDF aqui ou escolha um arquivo',
  description = `Somente PDF, até ${MAX_PDF_MB} MB. A conferência acontece no seu navegador antes do envio.`,
}: PdfUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      setError(null);

      if (rejections.length > 0 || accepted.length > 1) {
        setError('Envie um PDF por vez.');
        return;
      }

      const [file] = accepted;
      if (!file) return;

      setChecking(true);
      const result = await validatePdfFile(file);
      setChecking(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      onChange(file, { pageCount: result.pageCount });
    },
    [onChange]
  );

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  if (value) {
    return (
      <Stack
        direction="row"
        spacing={2}
        sx={(theme) => ({
          p: 2,
          alignItems: 'center',
          borderRadius: 1.5,
          border: `1px solid ${theme.vars.palette.divider}`,
        })}
      >
        <Iconify
          icon="solar:file-text-bold"
          width={40}
          sx={{ color: 'primary.main', flexShrink: 0 }}
        />

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap title={value.name}>
            {value.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {fData(value.size)}
          </Typography>
        </Box>

        <IconButton aria-label="Remover o PDF escolhido" onClick={handleRemove} disabled={disabled}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Upload
        multiple={false}
        disabled={disabled || checking}
        error={!!error}
        onDrop={handleDrop}
        hideFilesRejected
        sx={{ minHeight: 240 }}
        placeholder={
          <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
            {checking ? (
              <CircularProgress size={32} aria-label="Conferindo o PDF" />
            ) : (
              <UploadIllustration hideBackground sx={{ width: 160 }} />
            )}
            <Typography variant="h6">{checking ? 'Conferindo o PDF...' : title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {description}
            </Typography>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}
    </Stack>
  );
}

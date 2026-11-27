import type { IconifyName } from 'src/components/iconify';
import type { VerifyResult, VerifyStatus } from '../api/verify-document';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type StatusView = {
  color: 'success' | 'error' | 'warning';
  icon: IconifyName;
  title: string;
  description: string;
};

/** Três estados distintos por cor, ícone e texto (não depende só da cor). */
const STATUS_VIEWS: Record<VerifyStatus, StatusView> = {
  INTEGRO: {
    color: 'success',
    icon: 'solar:verified-check-bold',
    title: 'Documento íntegro',
    description:
      'A assinatura é válida e o arquivo não foi alterado desde que foi assinado no SaferDocs.',
  },
  ADULTERADO: {
    color: 'error',
    icon: 'solar:danger-triangle-bold',
    title: 'Documento adulterado',
    description:
      'Este arquivo tem uma assinatura, mas ela não confere: o conteúdo foi alterado depois de assinado ou a assinatura é inválida.',
  },
  NAO_ENCONTRADA: {
    color: 'warning',
    icon: 'solar:info-circle-bold',
    title: 'Assinatura não encontrada',
    description:
      'Não há assinatura do SaferDocs neste arquivo. Ele pode nunca ter sido assinado ou a assinatura foi removida.',
  },
};

/**
 * Data no horário de Brasília (ex.: "27/11/2026, 01:16:29 (horário de Brasília)"). O selo no PDF
 * continua em UTC (REQ-47); aqui a pessoa vê a hora local, sem precisar converter.
 */
export function formatBrasilia(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return iso;

  const local = date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return `${local} (horário de Brasília)`;
}

// ----------------------------------------------------------------------

export function VerifyResultCard({ result }: { result: VerifyResult }) {
  const view = STATUS_VIEWS[result.status];

  const details: { label: string; value: string }[] =
    result.status === 'INTEGRO'
      ? [
          ...(result.signerName ? [{ label: 'Assinado por', value: result.signerName }] : []),
          ...(result.signedAt
            ? [{ label: 'Data da assinatura', value: formatBrasilia(result.signedAt) }]
            : []),
          ...(result.signatureId ? [{ label: 'Id da assinatura', value: result.signatureId }] : []),
        ]
      : [];

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        p: 3,
        borderRadius: 2,
        border: `2px solid ${theme.vars.palette[view.color].main}`,
        bgcolor: `rgba(${theme.vars.palette[view.color].mainChannel} / 0.08)`,
      })}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Iconify
          icon={view.icon}
          width={48}
          sx={{ flexShrink: 0, color: `${view.color}.main` }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ color: `${view.color}.dark` }}>
            {view.title}
          </Typography>

          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {view.description}
          </Typography>

          {details.length > 0 && (
            <Box component="dl" sx={{ m: 0, mt: 2, display: 'grid', gap: 1.5 }}>
              {details.map(({ label, value }) => (
                <Box key={label}>
                  <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
                    {label}
                  </Typography>
                  <Typography component="dd" variant="subtitle2" sx={{ m: 0, wordBreak: 'break-all' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

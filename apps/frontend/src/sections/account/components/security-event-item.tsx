import type { SecurityEvent } from '../api/security-events';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';
import { describeUserAgent } from 'src/utils/user-agent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { securityEventInfo, securityEventOrigin } from '../security-event-info';

// ----------------------------------------------------------------------

const DATE_TIME_PT_BR = 'DD/MM/YYYY HH:mm';

type Props = {
  event: SecurityEvent;
  /** Mostra o selo "Novo" (evento que ainda não tinha sido visto). */
  highlightNew?: boolean;
};

/** Um evento de segurança: o que aconteceu, quando e de onde (REQ-58). */
export function SecurityEventItem({ event, highlightNew }: Props) {
  const info = securityEventInfo(event);
  const origin = securityEventOrigin(event);
  const color = info.severity === 'info' ? 'info' : info.severity;

  return (
    <Stack direction="row" spacing={2} data-testid="security-event" data-type={event.type}>
      <Box
        sx={(theme) => ({
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'flex',
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.vars.palette[color].main,
          bgcolor: `rgba(${theme.vars.palette[color].mainChannel} / 0.12)`,
        })}
      >
        <Iconify icon={info.icon} width={22} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="subtitle2">{info.title}</Typography>
          {highlightNew && !event.seen && <Label color="error">Novo</Label>}
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {info.description}
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
          {fDateTime(event.created_at, DATE_TIME_PT_BR)}
          {origin.ip && ` · IP ${origin.ip}`}
          {origin.userAgent && ` · ${describeUserAgent(origin.userAgent).label}`}
        </Typography>
      </Box>
    </Stack>
  );
}

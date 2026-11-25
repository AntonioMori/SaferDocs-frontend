import type { SecurityEvent } from '../api/security-events';

import { useRef, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useAuthContext } from 'src/auth/hooks';

import { SecurityEventItem } from './security-event-item';
import { listSecurityEvents, markSecurityEventsSeen } from '../api/security-events';

// ----------------------------------------------------------------------

/**
 * Destaque dos eventos de segurança não vistos, logo depois do login (REQ-58).
 *
 * O login e o refresh informam quantos eventos estão pendentes. Se houver algum, a área logada
 * busca a lista, mostra os não vistos num diálogo e já os marca como vistos: cada evento aparece
 * em destaque uma única vez. O histórico completo fica em Conta → Atividade.
 */
export function SecurityEventsHighlight() {
  const { unseenSecurityEvents, clearUnseenSecurityEvents } = useAuthContext();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const busy = useRef(false);

  useEffect(() => {
    if (unseenSecurityEvents <= 0 || busy.current) return;

    busy.current = true;

    (async () => {
      try {
        const unseen = (await listSecurityEvents()).filter((event) => !event.seen);

        if (unseen.length > 0) {
          setEvents(unseen);
          await markSecurityEventsSeen(unseen.map((event) => event.id));
        }
      } catch {
        // O destaque é um extra: se falhar, os eventos continuam na página de atividade.
      } finally {
        clearUnseenSecurityEvents();
        busy.current = false;
      }
    })();
  }, [unseenSecurityEvents, clearUnseenSecurityEvents]);

  const close = () => setEvents([]);

  return (
    <Dialog fullWidth maxWidth="sm" open={events.length > 0} onClose={close}>
      <DialogTitle>Atividade de segurança recente</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          {events.length === 1
            ? 'Aconteceu algo na sua conta desde o último acesso. Se não reconhecer, troque a senha e encerre as outras sessões.'
            : `Aconteceram ${events.length} eventos na sua conta desde o último acesso. Se não reconhecer algum, troque a senha e encerre as outras sessões.`}
        </DialogContentText>

        <Stack spacing={2.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
          {events.map((event) => (
            <SecurityEventItem key={event.id} event={event} />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button component={RouterLink} href={paths.conta.atividade} color="inherit" onClick={close}>
          Ver toda a atividade
        </Button>
        <Button variant="contained" onClick={close}>
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

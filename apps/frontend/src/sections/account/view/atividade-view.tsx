import type { SecurityEvent } from '../api/security-events';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { toApiError } from 'src/lib/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { SecurityEventItem } from '../components/security-event-item';
import { listSecurityEvents, markSecurityEventsSeen } from '../api/security-events';

// ----------------------------------------------------------------------

/**
 * Histórico de eventos de segurança da conta (REQ-58): IP novo, troca de IP na sessão, códigos
 * TOTP errados repetidos (REQ-16), 2FA ligado ou desligado, troca de senha, reuso de token de
 * sessão e passkey suspeita. Os que ainda não tinham sido vistos aparecem com o selo "Novo" e
 * passam a contar como vistos.
 */
export function AtividadeView() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listSecurityEvents();
      setEvents(data);

      const unseen = data.filter((event) => !event.seen).map((event) => event.id);
      if (unseen.length > 0) markSecurityEventsSeen(unseen).catch(() => {});
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardContent maxWidth="md">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Atividade de segurança
      </Typography>
      <Typography sx={{ mb: 4, color: 'text.secondary' }}>
        Eventos importantes da sua conta, com a data e de onde vieram. Se não reconhecer algum,
        troque a senha e encerre as outras sessões.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Tentar de novo
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card sx={{ p: 3 }}>
        {loading ? (
          <Stack sx={{ py: 3, alignItems: 'center' }}>
            <CircularProgress aria-label="Carregando a atividade" />
          </Stack>
        ) : (
          <Stack spacing={2.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {events.map((event) => (
              <SecurityEventItem key={event.id} event={event} highlightNew />
            ))}

            {!error && events.length === 0 && (
              <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                Nenhum evento de segurança por enquanto.
              </Typography>
            )}
          </Stack>
        )}
      </Card>
    </DashboardContent>
  );
}

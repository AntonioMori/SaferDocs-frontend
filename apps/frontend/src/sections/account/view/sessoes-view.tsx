import type { SessionItem } from '../api/sessions';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateTime } from 'src/utils/format-time';
import { describeUserAgent } from 'src/utils/user-agent';

import { DashboardContent } from 'src/layouts/dashboard';
import { isApiError, toApiError } from 'src/lib/api-error';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { showApiError } from 'src/components/hook-form/api-error';

import { useAuthContext } from 'src/auth/hooks';

import { ConfirmDialog } from '../components/confirm-dialog';
import { listSessions, revokeSession, revokeAllSessions } from '../api/sessions';

// ----------------------------------------------------------------------

/** Data e hora em pt-BR, 24 horas. */
const DATE_TIME_PT_BR = 'DD/MM/YYYY HH:mm';

type Pending = { kind: 'one'; session: SessionItem } | { kind: 'all' };

/**
 * Sessões ativas (REQ-57): onde a conta está aberta, com a sessão desta aba marcada. Dá para
 * encerrar cada uma ou sair de todos os dispositivos. Encerrar a própria sessão leva ao login.
 */
export function SessoesView() {
  const { signOut } = useAuthContext();

  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setItems(await listSessions());
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** A própria sessão acabou no servidor: limpa a memória e o AuthGuard leva ao login. */
  const endHere = async (message: string) => {
    toast.success(message);
    await signOut({ local: true });
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setWorking(true);

    try {
      if (pending.kind === 'all') {
        await revokeAllSessions();
        setPending(null);
        await endHere('Você saiu de todos os dispositivos.');
        return;
      }

      await revokeSession(pending.session.id);
      setPending(null);

      if (pending.session.current) {
        await endHere('Esta sessão foi encerrada.');
        return;
      }

      toast.success('Sessão encerrada.');
      setItems((prev) => prev.filter((item) => item.id !== pending.session.id));
    } catch (err) {
      setPending(null);

      if (isApiError(err) && err.status === 404) {
        toast.warning('Esta sessão já tinha sido encerrada. A lista foi atualizada.');
      } else {
        showApiError(err);
      }

      load();
    } finally {
      setWorking(false);
    }
  };

  const others = items.filter((item) => !item.current).length;

  return (
    <DashboardContent maxWidth="lg">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ mb: 3, gap: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="h4">Sessões ativas</Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Iconify icon="ic:round-power-settings-new" />}
          disabled={loading || items.length === 0}
          onClick={() => setPending({ kind: 'all' })}
        >
          Sair de todos os dispositivos
        </Button>
      </Stack>

      <Stack spacing={2}>
        <Typography sx={{ color: 'text.secondary' }}>
          Dispositivos e navegadores com a sua conta aberta. Se não reconhecer algum, encerre a
          sessão e troque a senha.
        </Typography>

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={load}>
                Tentar de novo
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Card>
          {loading ? (
            <Stack sx={{ p: 5, alignItems: 'center' }}>
              <CircularProgress aria-label="Carregando sessões" />
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dispositivo</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Criada em</TableCell>
                    <TableCell>Último uso</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => {
                    const device = describeUserAgent(item.user_agent);

                    return (
                      <TableRow key={item.id} hover data-testid="session-row" data-current={item.current}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            <Iconify
                              width={24}
                              icon={device.kind === 'mobile' ? 'solar:smartphone-2-bold' : 'solar:monitor-bold'}
                              sx={{ color: 'text.secondary', flexShrink: 0 }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Typography variant="subtitle2">{device.label}</Typography>
                                {item.current && <Label color="success">Esta sessão</Label>}
                              </Stack>
                              <Tooltip title={item.user_agent ?? ''}>
                                <Typography
                                  variant="caption"
                                  noWrap
                                  component="div"
                                  sx={{ color: 'text.disabled', maxWidth: 360 }}
                                >
                                  {item.user_agent ?? 'User-Agent não informado'}
                                </Typography>
                              </Tooltip>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {item.ip ?? 'Não informado'}
                        </TableCell>
                        <TableCell>{fDateTime(item.created_at, DATE_TIME_PT_BR)}</TableCell>
                        <TableCell>{fDateTime(item.last_seen_at, DATE_TIME_PT_BR)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Encerrar sessão">
                            <IconButton
                              color="error"
                              aria-label={`Encerrar a sessão ${device.label}${item.current ? ' (esta sessão)' : ''}`}
                              onClick={() => setPending({ kind: 'one', session: item })}
                            >
                              <Iconify icon="solar:close-circle-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!error && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ color: 'text.secondary' }}>Nenhuma sessão ativa.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Stack>

      <ConfirmDialog
        open={!!pending}
        loading={working}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={pending?.kind === 'all' ? 'Sair de todos os dispositivos?' : 'Encerrar esta sessão?'}
        confirmLabel={pending?.kind === 'all' ? 'Sair de todos' : 'Encerrar'}
        content={
          pending?.kind === 'all'
            ? `Todas as sessões da conta serão encerradas${others ? `, inclusive as ${others} em outros dispositivos` : ''}, e você vai precisar entrar de novo aqui também.`
            : pending?.session.current
              ? 'É a sessão que você está usando agora: você vai voltar para a tela de login.'
              : 'Quem estiver usando a conta nesse dispositivo vai precisar entrar de novo.'
        }
      />
    </DashboardContent>
  );
}

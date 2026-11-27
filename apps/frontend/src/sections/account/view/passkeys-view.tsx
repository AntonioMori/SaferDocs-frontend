import type { PasskeyItem } from '../api/passkeys';

import { useState, useEffect, useCallback } from 'react';

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

import { toApiError } from 'src/lib/api-error';
import { isPasskeySupported } from 'src/lib/webauthn';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { listPasskeys } from '../api/passkeys';
import { RenamePasskeyDialog } from '../components/rename-passkey-dialog';
import { RevokePasskeyDialog } from '../components/revoke-passkey-dialog';
import { RegisterPasskeyDialog } from '../components/register-passkey-dialog';

// ----------------------------------------------------------------------

const NIL_AAGUID = '00000000-0000-0000-0000-000000000000';

/** Data e hora em pt-BR, 24 horas (o padrão do template é em inglês, com am/pm). */
const DATE_TIME_PT_BR = 'DD/MM/YYYY HH:mm';

export function PasskeysView() {
  const supported = isPasskeySupported();

  const [items, setItems] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [renaming, setRenaming] = useState<PasskeyItem | null>(null);
  const [revoking, setRevoking] = useState<PasskeyItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setItems(await listPasskeys());
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** A passkey já não existe no servidor (404): tira da tabela e recarrega a lista. */
  const handleGone = useCallback(
    (gone: PasskeyItem) => {
      setItems((prev) => prev.filter((item) => item.id !== gone.id));
      load();
    },
    [load]
  );

  return (
    <DashboardContent maxWidth="lg">
      <Stack
        direction="row"
        sx={{ mb: 3, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h4">Passkeys</Typography>

        <Button
          color="primary"
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          disabled={!supported}
          onClick={() => setRegisterOpen(true)}
        >
          Cadastrar passkey
        </Button>
      </Stack>

      <Stack spacing={2}>
        <Typography sx={{ color: 'text.secondary' }}>
          Entre na sua conta com biometria, PIN do dispositivo ou chave de segurança, sem digitar a
          senha. Revogue os dispositivos que você não usa mais.
        </Typography>

        {!supported && (
          <Alert severity="warning">
            Este navegador não oferece suporte a passkeys (WebAuthn). Use um navegador moderno em
            conexão segura (HTTPS ou localhost).
          </Alert>
        )}

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
              <CircularProgress aria-label="Carregando passkeys" />
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Modelo (AAGUID)</TableCell>
                    <TableCell>Criada em</TableCell>
                    <TableCell>Último uso</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 'fontWeightMedium' }}>{item.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {item.aaguid === NIL_AAGUID ? 'Não informado' : item.aaguid}
                      </TableCell>
                      <TableCell>{fDateTime(item.created_at, DATE_TIME_PT_BR)}</TableCell>
                      <TableCell>
                        {item.last_used_at
                          ? fDateTime(item.last_used_at, DATE_TIME_PT_BR)
                          : 'Nunca usada'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Renomear">
                          <IconButton
                            aria-label={`Renomear a passkey ${item.name}`}
                            onClick={() => setRenaming(item)}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revogar">
                          <IconButton
                            color="error"
                            aria-label={`Revogar a passkey ${item.name}`}
                            onClick={() => setRevoking(item)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!error && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ color: 'text.secondary' }}>
                          Nenhuma passkey cadastrada.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Stack>

      <RegisterPasskeyDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(created) => setItems((prev) => [created, ...prev])}
      />

      <RenamePasskeyDialog
        passkey={renaming}
        onClose={() => setRenaming(null)}
        onRenamed={(updated) =>
          setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
        onGone={handleGone}
      />

      <RevokePasskeyDialog
        passkey={revoking}
        onClose={() => setRevoking(null)}
        onRevoked={(removed) => setItems((prev) => prev.filter((item) => item.id !== removed.id))}
        onGone={handleGone}
      />
    </DashboardContent>
  );
}

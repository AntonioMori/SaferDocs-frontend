import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { isPasskeySupported, isPasskeyClientError } from 'src/lib/webauthn';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { showApiError } from 'src/components/hook-form/api-error';

import { useAuthContext } from 'src/auth/hooks';

import { loginWithPasskey } from '../account/api/passkeys';

// ----------------------------------------------------------------------

type PasskeyLoginButtonProps = {
  /** Desabilita o botão, por exemplo enquanto o login por senha está em andamento. */
  disabled?: boolean;
  /** Para onde ir depois de entrar. Por padrão, a tela de assinatura. */
  redirectTo?: string;
  /** Avisa a tela que hospeda o botão quando a cerimônia começa e termina. */
  onLoadingChange?: (loading: boolean) => void;
};

/**
 * Botão "Entrar com passkey". Executa a cerimônia completa
 * (`POST /auth/passkeys/login/options` -> `navigator.credentials.get` ->
 * `POST /auth/passkeys/login/verify`), abre a sessão com o `signIn` do contexto e navega.
 *
 * É independente de qualquer tela de login: basta renderizá-lo dentro dela.
 */
export function PasskeyLoginButton({
  disabled,
  redirectTo = paths.assinar,
  onLoadingChange,
}: PasskeyLoginButtonProps) {
  const router = useRouter();
  const { signIn } = useAuthContext();

  const passkeySupported = isPasskeySupported();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changeLoading = (value: boolean) => {
    setLoading(value);
    onLoadingChange?.(value);
  };

  const handleClick = async () => {
    setErrorMessage(null);
    changeLoading(true);

    try {
      const data = await loginWithPasskey();
      signIn(data);
      router.push(redirectTo);
    } catch (error) {
      if (isPasskeyClientError(error)) {
        setErrorMessage(error.message);
        toast.error(error.message);
        return;
      }

      showApiError(error);
    } finally {
      changeLoading(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}

      <Button
        type="button"
        variant="outlined"
        size="large"
        loading={loading}
        disabled={!passkeySupported || disabled}
        onClick={handleClick}
        startIcon={<Iconify icon="ic:round-vpn-key" />}
      >
        Entrar com passkey
      </Button>

      {!passkeySupported && (
        <Alert severity="info">
          Este navegador ou dispositivo não oferece suporte a login com passkey.
        </Alert>
      )}
    </Stack>
  );
}

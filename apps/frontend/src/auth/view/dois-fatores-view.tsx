import type { ApiError } from 'src/lib/api-error';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { toApiError } from 'src/lib/api-error';
import { PasswordIcon } from 'src/assets/icons';
import { totpCodeSchema } from 'src/lib/schemas';

import { Form } from 'src/components/hook-form';

import { signInWithTotp } from '../api/auth';
import { FormHead } from '../components/form-head';
import { useCooldown, useAuthContext } from '../hooks';
import { TotpCodeField } from '../components/totp-code-field';
import { FormReturnLink } from '../components/form-return-link';
import { getMfaChallenge, clearMfaChallenge } from '../context/jwt';

// ----------------------------------------------------------------------

/** Mesmo limite do backend (`MFA_MAX_ATTEMPTS`): depois disso o desafio não vale mais. */
const MAX_ATTEMPTS = 5;

const CodeSchema = z.object({ code: totpCodeSchema });

type CodeInput = z.input<typeof CodeSchema>;
type CodeOutput = z.output<typeof CodeSchema>;

// ----------------------------------------------------------------------

/**
 * Segundo passo do login (REQ-15). Só chega aqui quem acertou a senha de uma conta com 2FA; o
 * `mfa_token` vem da memória (nunca da URL ou do storage). Nenhum token de acesso existe até o
 * código ser aceito: sem código válido, ninguém entra.
 */
export function DoisFatoresView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthContext();
  const cooldown = useCooldown();

  const [challenge] = useState(getMfaChallenge);
  const [expired, setExpired] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);

  const returnTo = searchParams.get('returnTo');
  const loginHref = returnTo
    ? `${paths.entrar}?${new URLSearchParams({ returnTo }).toString()}`
    : paths.entrar;

  const methods = useForm<CodeInput, unknown, CodeOutput>({
    resolver: zodResolver(CodeSchema),
    defaultValues: { code: '' },
  });

  const {
    handleSubmit,
    resetField,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  // Sem desafio (F5, acesso direto): volta ao login.
  useEffect(() => {
    if (!challenge) router.replace(loginHref);
  }, [challenge, loginHref, router]);

  // O desafio vence em poucos minutos: avisa quando acabar.
  useEffect(() => {
    if (!challenge) return undefined;

    const timer = setTimeout(() => setExpired(true), Math.max(challenge.expiresAt - Date.now(), 0));

    return () => clearTimeout(timer);
  }, [challenge]);

  const giveUp = useCallback(() => clearMfaChallenge(), []);

  const onSubmit = handleSubmit(async (values) => {
    if (!challenge) return;

    setError(null);

    try {
      const data = await signInWithTotp(challenge.token, values.code);

      clearMfaChallenge();
      // O GuestGuard da rota leva ao `returnTo` (ou à tela de assinatura).
      signIn(data);
    } catch (err) {
      const apiError = toApiError(err);

      setError(apiError);
      if (apiError.status === 429) cooldown.start(apiError.retryAfter);
      if (apiError.status === 401) setAttempts((value) => value + 1);

      resetField('code');
      setFocus('code');
    }
  });

  if (!challenge) return null;

  const exhausted = attempts >= MAX_ATTEMPTS;
  const finished = expired || exhausted;

  return (
    <>
      <FormHead
        icon={<PasswordIcon />}
        title="Verificação em duas etapas"
        description={'Abra o app autenticador (Google Authenticator, Authy...)\ne digite o código de 6 dígitos do SaferDocs.'}
      />

      {finished && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {expired
            ? 'O tempo para digitar o código acabou. Entre de novo com e-mail e senha.'
            : 'Muitas tentativas com código errado. Entre de novo com e-mail e senha.'}
        </Alert>
      )}

      {!finished && error && (
        <Alert severity="error" role="alert" sx={{ mb: 3 }}>
          {error.message}
          {cooldown.active && ` Tente de novo em ${cooldown.seconds} s.`}
        </Alert>
      )}

      {finished ? (
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => {
            giveUp();
            router.replace(loginHref);
          }}
        >
          Voltar ao login
        </Button>
      ) : (
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <TotpCodeField label="Código de verificação" autoFocus />

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={cooldown.active}
            >
              {cooldown.active ? `Tente de novo em ${cooldown.seconds} s` : 'Verificar e entrar'}
            </Button>
          </Box>
        </Form>
      )}

      {!finished && <FormReturnLink href={loginHref} label="Voltar ao login" onClick={giveUp} />}
    </>
  );
}

import type { ApiError } from 'src/lib/api-error';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { toApiError } from 'src/lib/api-error';
import { PasswordIcon } from 'src/assets/icons';
import { totpCodeSchema, recoveryCodeSchema } from 'src/lib/schemas';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { signInWithTotp } from '../api/auth';
import { FormHead } from '../components/form-head';
import { useCooldown, useAuthContext } from '../hooks';
import { TotpCodeField } from '../components/totp-code-field';
import { FormReturnLink } from '../components/form-return-link';
import { getMfaChallenge, clearMfaChallenge } from '../context/jwt';

// ----------------------------------------------------------------------

/** Mesmo limite do backend (`MFA_MAX_ATTEMPTS`): depois disso o desafio não vale mais. */
const MAX_ATTEMPTS = 5;

/** O modo diz qual campo vale: o código do app ou um código de recuperação (REQ-14). */
const CodeSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('totp'), code: totpCodeSchema, recoveryCode: z.string() }),
  z.object({ mode: z.literal('recovery'), code: z.string(), recoveryCode: recoveryCodeSchema }),
]);

type CodeInput = z.input<typeof CodeSchema>;
type CodeOutput = z.output<typeof CodeSchema>;

// ----------------------------------------------------------------------

/**
 * Segundo passo do login (REQ-15). Só chega aqui quem acertou a senha de uma conta com 2FA; o
 * `mfa_token` vem da memória (nunca da URL ou do storage). Nenhum token de acesso existe até o
 * código ser aceito: sem código válido, ninguém entra.
 *
 * Quem perdeu o celular usa um dos códigos de recuperação (REQ-14), que vale uma vez só.
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
    defaultValues: { mode: 'totp', code: '', recoveryCode: '' },
  });

  const {
    watch,
    setValue,
    clearErrors,
    handleSubmit,
    resetField,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  const mode = watch('mode');
  const field = mode === 'totp' ? 'code' : 'recoveryCode';

  const toggleMode = () => {
    const next = mode === 'totp' ? 'recovery' : 'totp';

    setError(null);
    clearErrors();
    setValue('mode', next);
    resetField('code');
    resetField('recoveryCode');
    // O campo novo só existe depois do próximo render.
    setTimeout(() => setFocus(next === 'totp' ? 'code' : 'recoveryCode'));
  };

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
      const data = await signInWithTotp(
        challenge.token,
        values.mode === 'totp' ? { code: values.code } : { recovery_code: values.recoveryCode }
      );

      clearMfaChallenge();
      if (values.mode === 'recovery') {
        toast.info('Você entrou com um código de recuperação. Ele não vale mais.');
      }
      // O GuestGuard da rota leva ao `returnTo` (ou à tela de assinatura).
      signIn(data);
    } catch (err) {
      const apiError = toApiError(err);

      setError(apiError);
      if (apiError.status === 429) cooldown.start(apiError.retryAfter);
      if (apiError.status === 401) setAttempts((value) => value + 1);

      resetField(field);
      setFocus(field);
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
        description={
          mode === 'totp'
            ? 'Abra o app autenticador (Google Authenticator, Authy...)\ne digite o código de 6 dígitos do SaferDocs.'
            : 'Digite um dos códigos de recuperação que você guardou\nao ativar a verificação em duas etapas.'
        }
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
            {mode === 'totp' ? (
              <TotpCodeField label="Código de verificação" autoFocus />
            ) : (
              <Field.Text
                name="recoveryCode"
                label="Código de recuperação"
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    maxLength: 32,
                    spellCheck: false,
                    autoCapitalize: 'characters',
                    style: { letterSpacing: 2, fontSize: 18, textAlign: 'center', fontFamily: 'monospace' },
                  },
                }}
              />
            )}

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

            <Link component="button" type="button" variant="body2" onClick={toggleMode} sx={{ alignSelf: 'center' }}>
              {mode === 'totp' ? 'Perdi o celular: usar um código de recuperação' : 'Usar o código do app autenticador'}
            </Link>
          </Box>
        </Form>
      )}

      {!finished && <FormReturnLink href={loginHref} label="Voltar ao login" onClick={giveUp} />}
    </>
  );
}

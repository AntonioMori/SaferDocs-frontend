import type { ApiError } from 'src/lib/api-error';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { emailSchema } from 'src/lib/schemas';
import { toApiError } from 'src/lib/api-error';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { PasskeyLoginButton } from 'src/sections/auth/passkey-login-button';

import { isMfaRequired } from '../types';
import { signInWithPassword } from '../api/auth';
import { startMfaChallenge } from '../context/jwt';
import { FormHead } from '../components/form-head';
import { useCooldown, useAuthContext } from '../hooks';
import { FormDivider } from '../components/form-divider';

// ----------------------------------------------------------------------

/** A senha só não pode ser vazia: a política (REQ-01) vale no cadastro, não no login. */
const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Informe a senha.' }),
});

type LoginSchemaType = z.input<typeof LoginSchema>;

// ----------------------------------------------------------------------

/**
 * Login com e-mail e senha (REQ-04).
 *
 * A tela nunca diz se o e-mail existe: qualquer falha de credencial mostra a mensagem única da
 * API (AUTH_001), também quando a conta está bloqueada por tentativas (REQ-03). No 429 (REQ-05),
 * mostra o tempo de espera e segura o botão até acabar. A resposta abre a sessão pelo `signIn` do
 * contexto, e o GuestGuard da rota leva ao `returnTo` (ou à tela de assinatura).
 */
export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthContext();
  const showPassword = useBoolean();
  const cooldown = useCooldown();

  const [error, setError] = useState<ApiError | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const methods = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    handleSubmit,
    resetField,
    setFocus,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const data = await signInWithPassword(values.email, values.password);

      // Conta com 2FA: nenhum token ainda, só o desafio, que fica em memória (REQ-15).
      if (isMfaRequired(data)) {
        startMfaChallenge(data);

        const returnTo = searchParams.get('returnTo');
        router.push(
          returnTo
            ? `${paths.doisFatores}?${new URLSearchParams({ returnTo }).toString()}`
            : paths.doisFatores
        );
        return;
      }

      signIn(data);
    } catch (err) {
      const apiError = toApiError(err);

      setError(apiError);
      if (apiError.status === 429) cooldown.start(apiError.retryAfter);

      // A senha errada não fica no campo nem na memória do formulário.
      resetField('password');
      setFocus('password');
    }
  });

  const busy = isSubmitting || passkeyLoading;

  return (
    <>
      <FormHead
        title="Entrar no SaferDocs"
        description={
          <>
            {'Ainda não tem conta? '}
            <Link component={RouterLink} href={paths.cadastro} variant="subtitle2">
              Criar conta
            </Link>
          </>
        }
      />

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 3 }}>
          {error.message}
          {cooldown.active && ` Tente de novo em ${cooldown.seconds} s.`}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="password"
            label="Senha"
            type={showPassword.value ? 'text' : 'password'}
            autoComplete="current-password"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={showPassword.onToggle}
                      edge="end"
                      aria-label={showPassword.value ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={passkeyLoading || cooldown.active}
          >
            {cooldown.active ? `Tente de novo em ${cooldown.seconds} s` : 'Entrar'}
          </Button>
        </Box>
      </Form>

      <FormDivider label="OU" />

      <PasskeyLoginButton disabled={busy} onLoadingChange={setPasskeyLoading} />
    </>
  );
}

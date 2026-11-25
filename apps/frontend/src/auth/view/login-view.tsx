import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { emailSchema } from 'src/lib/schemas';
import axios, { endpoints } from 'src/lib/axios';

import { showApiError } from 'src/components/hook-form/api-error';

import { PasskeyLoginButton } from 'src/sections/auth/passkey-login-button';

import { useAuthContext } from '../hooks';
import { setSession } from '../context/jwt';
import { FormDivider } from '../components/form-divider';

// ----------------------------------------------------------------------

/**
 * Login com e-mail e senha: `POST /auth/login`, e o token vai para o `setSession` do contexto jwt
 * (sessionStorage + header Authorization do axios).
 *
 * Base do REQ-04. Ainda falta, a cargo de quem responde pelo REQ-04: o passo do segundo fator
 * (`mfa_token`) e os detalhes finais da tela (recuperação de senha, bloqueio, textos).
 */
export function LoginView() {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    // Valida antes de enviar (REQ-64). A senha só não pode ser vazia: a política é do cadastro.
    const parsedEmail = emailSchema.safeParse(email);
    setEmailError(parsedEmail.success ? null : parsedEmail.error.issues[0].message);
    setPasswordError(password ? null : 'Informe a senha.');

    if (!parsedEmail.success || !password) return;

    setSubmitting(true);

    try {
      const { data } = await axios.post(endpoints.auth.signIn, {
        email: parsedEmail.data,
        password,
      });

      // O backend responde `access_token`. Conta com 2FA recebe `mfa_token`, e esse passo
      // ainda não existe nesta tela (REQ-04).
      if (!data?.access_token) {
        setNotice('Esta conta exige o segundo fator, que ainda não está disponível nesta tela.');
        return;
      }

      await setSession(data.access_token);
      await checkUserSession?.();
      router.push(paths.assinar);
    } catch (error) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
      <Typography variant="h5">Entrar</Typography>

      {notice && <Alert severity="info">{notice}</Alert>}

      <TextField
        label="E-mail"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={!!emailError}
        helperText={emailError}
        required
      />

      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={!!passwordError}
        helperText={passwordError}
        required
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={submitting}
        disabled={passkeyLoading}
      >
        Entrar
      </Button>

      <FormDivider label="OU" sx={{ my: 0 }} />

      <PasskeyLoginButton disabled={submitting} onLoadingChange={setPasskeyLoading} />
    </Stack>
  );
}

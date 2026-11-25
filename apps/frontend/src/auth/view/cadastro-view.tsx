import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { nameSchema, emailSchema } from 'src/lib/schemas';
import { newPasswordSchema } from 'src/lib/password-policy';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { PasswordRules } from 'src/components/password-rules';
import { Form, Field, handleApiFormError } from 'src/components/hook-form';

import { isMfaRequired } from '../types';
import { useAuthContext } from '../hooks';
import { FormHead } from '../components/form-head';
import { signUp, signInWithPassword } from '../api/auth';

// ----------------------------------------------------------------------

const CadastroSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, { error: 'Repita a senha.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: 'As senhas não são iguais.',
    path: ['confirmPassword'],
  });

type CadastroInput = z.input<typeof CadastroSchema>;
type CadastroOutput = z.output<typeof CadastroSchema>;

// ----------------------------------------------------------------------

/**
 * Cadastro com a política de senhas (REQ-01). O formulário não envia senha fraca: cada regra
 * aparece no indicador e a primeira pendente vira a mensagem do campo. Depois do cadastro, a
 * conta entra direto (conta nova não tem 2FA).
 */
export function CadastroView() {
  const router = useRouter();
  const { signIn } = useAuthContext();
  const showPassword = useBoolean();

  const methods = useForm<CadastroInput, unknown, CadastroOutput>({
    resolver: zodResolver(CadastroSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp({ name: values.name, email: values.email, password: values.password });
    } catch (error) {
      // E-mail já cadastrado, nome ou senha recusados: o erro vai para o campo certo.
      handleApiFormError(methods, error);
      return;
    }

    toast.success('Conta criada.');

    try {
      const data = await signInWithPassword(values.email, values.password);

      if (!isMfaRequired(data)) {
        signIn(data);
        return;
      }
    } catch {
      // Sem sessão automática: a pessoa entra pela tela de login.
    }

    router.replace(paths.entrar);
  });

  const visibility = (
    <InputAdornment position="end">
      <IconButton
        onClick={showPassword.onToggle}
        edge="end"
        aria-label={showPassword.value ? 'Ocultar senha' : 'Mostrar senha'}
      >
        <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <>
      <FormHead
        title="Criar conta"
        description={
          <>
            {'Já tem conta? '}
            <Link component={RouterLink} href={paths.entrar} variant="subtitle2">
              Entrar
            </Link>
          </>
        }
      />

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="name"
            label="Nome"
            autoComplete="name"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="password"
            label="Senha"
            type={showPassword.value ? 'text' : 'password'}
            autoComplete="new-password"
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: visibility } }}
          />

          <PasswordRules password={password ?? ''} sx={{ mt: -1.5 }} />

          <Field.Text
            name="confirmPassword"
            label="Repita a senha"
            type={showPassword.value ? 'text' : 'password'}
            autoComplete="new-password"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Criar conta
          </Button>
        </Box>
      </Form>
    </>
  );
}

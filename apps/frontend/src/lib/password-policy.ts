import { z } from 'zod';

// ----------------------------------------------------------------------

/**
 * Política de senhas (REQ-01), espelho de `app/core/password_policy.py` do backend: de 12 a 128
 * caracteres, com maiúscula, minúscula, número e símbolo. Vale no cadastro e na troca de senha.
 *
 * Os tamanhos contam pontos de código, como o `len` do Python, e as classes de caractere usam as
 * categorias Unicode, como `isupper`, `islower` e `isdigit`. O backend continua sendo a validação
 * que vale. Aqui só se dá a resposta rápida e o indicador das regras.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRule = {
  id: 'length' | 'upper' | 'lower' | 'digit' | 'symbol';
  /** Texto curto para a lista de regras. */
  label: string;
  /** Mensagem de erro quando a regra não é cumprida. */
  message: string;
  test: (password: string) => boolean;
};

const length = (password: string) => Array.from(password).length;

/** Símbolo: nem letra, nem número, nem espaço (como `not isalnum() and not isspace()`). */
const SYMBOL = /[^\p{L}\p{N}\s]/u;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `De ${PASSWORD_MIN_LENGTH} a ${PASSWORD_MAX_LENGTH} caracteres`,
    message: `A senha precisa ter de ${PASSWORD_MIN_LENGTH} a ${PASSWORD_MAX_LENGTH} caracteres.`,
    test: (password) => length(password) >= PASSWORD_MIN_LENGTH && length(password) <= PASSWORD_MAX_LENGTH,
  },
  {
    id: 'upper',
    label: 'Uma letra maiúscula',
    message: 'A senha precisa de ao menos uma letra maiúscula.',
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    id: 'lower',
    label: 'Uma letra minúscula',
    message: 'A senha precisa de ao menos uma letra minúscula.',
    test: (password) => /\p{Ll}/u.test(password),
  },
  {
    id: 'digit',
    label: 'Um número',
    message: 'A senha precisa de ao menos um número.',
    test: (password) => /\p{Nd}/u.test(password),
  },
  {
    id: 'symbol',
    label: 'Um símbolo (ex.: ! @ # $ %)',
    message: 'A senha precisa de ao menos um símbolo.',
    test: (password) => SYMBOL.test(password),
  },
];

/** Regras que a senha ainda não cumpre (vazia = senha aceita). */
export function passwordViolations(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password));
}

/**
 * Senha nova (cadastro e troca): um erro por regra não cumprida, para o formulário nunca enviar
 * senha fraca. O texto da senha não é alterado (sem trim): espaços contam como caracteres.
 */
export const newPasswordSchema = z.string({ error: 'Informe a senha.' }).superRefine((password, ctx) => {
  if (password.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Informe a senha.' });
    return;
  }

  passwordViolations(password).forEach((rule) => {
    ctx.addIssue({ code: 'custom', message: rule.message, params: { rule: rule.id } });
  });
});

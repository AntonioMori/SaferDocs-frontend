import { z } from 'zod';

// ----------------------------------------------------------------------

/**
 * Schemas zod compartilhados pelos formulários (REQ-64).
 *
 * Espelham as regras do backend (`clean_text`): texto de uma linha, sem `<` nem `>`, sem
 * caracteres de controle ou invisíveis, com espaços normalizados. O backend continua sendo a
 * validação que vale; aqui só se dá a resposta rápida. O que o usuário digita é sempre
 * renderizado como texto pelo React, nunca como HTML.
 */

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/;
const ANGLE_BRACKETS = /[<>]/;

type TextOptions = { label: string; min: number; max: number };

/** Texto de uma linha: normaliza (NFKC e espaços), exige caractere visível e barra `<`, `>` e controle. */
export function plainText({ label, min, max }: TextOptions) {
  return z
    .string({ error: `Informe ${label}.` })
    .transform((value) => value.normalize('NFKC').replace(/\s+/g, ' ').trim())
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `Informe ${label}.` : `${label} precisa ter ao menos ${min} caracteres.`)
        .max(max, `${label} deve ter no máximo ${max} caracteres.`)
        .refine((value) => !ANGLE_BRACKETS.test(value), 'Os caracteres < e > não são permitidos.')
        .refine((value) => !CONTROL_CHARS.test(value), 'Caracteres de controle não são permitidos.')
    );
}

// ----------------------------------------------------------------------

/** Nome de pessoa (até 120 caracteres). */
export const nameSchema = plainText({ label: 'O nome', min: 1, max: 120 });

/** E-mail: sem espaços nas pontas, minúsculo e com até 254 caracteres. */
export const emailSchema = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
  .pipe(z.email('Informe um e-mail válido.'));

/** Nome de passkey: de 1 a 60 caracteres. */
export const passkeyNameSchema = plainText({ label: 'O nome da passkey', min: 1, max: 60 });

/** Nome de passkey opcional (cadastro): vazio vira o padrão do backend. */
export const optionalPasskeyNameSchema = z.union([z.literal(''), passkeyNameSchema]);

// ----------------------------------------------------------------------

/**
 * Posição do selo (REQ-49): `page` inteira a partir de 1; `x` e `y` em pontos, a partir do
 * canto inferior esquerdo, arredondados a 2 casas (evita notação científica no corpo do POST).
 */
const points = (label: string) =>
  z
    .number({ error: `${label} inválido.` })
    .finite(`${label} inválido.`)
    .min(0, `${label} não pode ser negativo.`)
    .max(100000, `${label} fora do limite.`)
    .transform((value) => Math.round(value * 100) / 100);

export const sealPositionSchema = z.object({
  page: z
    .number({ error: 'Página inválida.' })
    .int('Página inválida.')
    .min(1, 'Página inválida.')
    .max(100000, 'Página inválida.'),
  x: points('x'),
  y: points('y'),
});

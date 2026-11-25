import { z } from 'zod';

// ----------------------------------------------------------------------

/**
 * Schemas zod compartilhados pelos formulários (REQ-64).
 *
 * Espelham o `clean_text` do backend (`app/core/text_input.py`): texto de uma linha, normalizado
 * em NFKC, sem `<` nem `>`, sem caracteres de controle, de formato ou invisíveis, sem os
 * "preenchedores" que não desenham nada, com pelo menos um caractere visível e espaços
 * repetidos reduzidos a um. O ZWJ (U+200D) só passa entre dois emoji. O backend continua sendo a
 * validação que vale; aqui só se dá a resposta rápida. O que o usuário digita é sempre
 * renderizado como texto pelo React, nunca como HTML.
 *
 * Os tamanhos contam pontos de código (como o `len` do Python), não unidades UTF-16.
 */

const ANGLE_BRACKETS = /[<>]/;

/**
 * Controle (Cc), formato (Cf), separadores de linha e de parágrafo (Zl, Zp), uso privado (Co),
 * surrogates soltos (Cs) e não atribuídos (Cn). O espaço comum fica de fora desta checagem.
 */
const FORBIDDEN_CATEGORY = /^[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Co}\p{Cs}\p{Cn}]$/u;

/** Hangul de preenchimento (U+115F, U+1160, U+3164, U+FFA0) e braille vazio (U+2800). */
const FILLER_CHARS = new Set(['ᅟ', 'ᅠ', 'ㅤ', 'ﾠ', '⠀']);

/** Pelo menos uma letra, número, pontuação ou símbolo. */
const VISIBLE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/u;

const ZWJ = '‍';
const VARIATION_SELECTOR_16 = '️';

const SYMBOL_OTHER = /^\p{So}$/u;
const SKIN_TONE_FIRST = 0x1f3fb;
const SKIN_TONE_LAST = 0x1f3ff;

const isEmoji = (char: string) => {
  const code = char.codePointAt(0) ?? 0;

  return SYMBOL_OTHER.test(char) || (code >= SKIN_TONE_FIRST && code <= SKIN_TONE_LAST);
};

/** O ZWJ em `index` está entre dois emoji (antes dele pode vir o seletor de variação VS16). */
function zwjJoinsEmoji(chars: string[], index: number): boolean {
  if (index + 1 >= chars.length || !isEmoji(chars[index + 1])) return false;

  let before = index - 1;
  if (before >= 1 && chars[before] === VARIATION_SELECTOR_16) before -= 1;

  return before >= 0 && isEmoji(chars[before]);
}

function hasForbiddenChar(chars: string[]): boolean {
  return chars.some((char, index) => {
    if (char === ' ') return false;
    if (FILLER_CHARS.has(char)) return true;
    if (!FORBIDDEN_CATEGORY.test(char)) return false;

    return !(char === ZWJ && zwjJoinsEmoji(chars, index));
  });
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type TextOptions = {
  /** Como o campo aparece no meio da frase, com artigo e em minúscula: `o nome da passkey`. */
  label: string;
  min: number;
  max: number;
};

/** Mesma ordem de checagens do `clean_text`; devolve a mensagem do primeiro problema ou o texto limpo. */
export function cleanText(
  raw: string,
  { label, min, max }: TextOptions
): { ok: true; value: string } | { ok: false; message: string } {
  const normalized = raw.normalize('NFKC');

  if (ANGLE_BRACKETS.test(normalized)) {
    return { ok: false, message: 'Os caracteres < e > não são permitidos.' };
  }

  if (hasForbiddenChar(Array.from(normalized))) {
    return { ok: false, message: 'Caracteres de controle ou invisíveis não são permitidos.' };
  }

  const value = normalized.split(/\s+/).filter(Boolean).join(' ');
  const length = Array.from(value).length;

  if (length < min) {
    return {
      ok: false,
      message: min <= 1 ? `Informe ${label}.` : `${capitalize(label)} precisa ter ao menos ${min} caracteres.`,
    };
  }

  if (!VISIBLE_CHAR.test(value)) {
    return { ok: false, message: `${capitalize(label)} precisa ter ao menos um caractere visível.` };
  }

  if (length > max) {
    return { ok: false, message: `${capitalize(label)} deve ter no máximo ${max} caracteres.` };
  }

  return { ok: true, value };
}

/** Texto de uma linha, no mesmo padrão do backend (`clean_text`). */
export function plainText(options: TextOptions) {
  return z.string({ error: `Informe ${options.label}.` }).transform((raw, ctx) => {
    const result = cleanText(raw, options);

    if (!result.ok) {
      ctx.issues.push({ code: 'custom', message: result.message, input: raw });
      return z.NEVER;
    }

    return result.value;
  });
}

// ----------------------------------------------------------------------

/** Nome de pessoa: de 2 a 120 caracteres, como no cadastro do backend (`RegisterIn`). */
export const nameSchema = plainText({ label: 'o nome', min: 2, max: 120 });

/** E-mail: sem espaços nas pontas, minúsculo e com até 254 caracteres. */
export const emailSchema = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
  .pipe(z.email('Informe um e-mail válido.'));

/** Nome de passkey: de 1 a 60 caracteres. */
export const passkeyNameSchema = plainText({ label: 'o nome da passkey', min: 1, max: 60 });

/**
 * Nome de passkey opcional (cadastro): vazio, ou só com espaços, vira `''` e significa "usar o
 * nome padrão" (o formulário não envia o campo). Qualquer outro texto segue as regras do nome.
 */
export const optionalPasskeyNameSchema = z
  .string({ error: 'Informe o nome da passkey.' })
  .transform((raw) => (raw.normalize('NFKC').trim() === '' ? '' : raw))
  .pipe(z.union([z.literal(''), passkeyNameSchema]));

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

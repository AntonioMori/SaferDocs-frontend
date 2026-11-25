import { z } from 'zod';

// ----------------------------------------------------------------------

/**
 * Schema das variáveis de ambiente (RNF-08).
 *
 * Fica fora de `global-config.ts` e sem imports de `src/...` para o `vite.config.ts`
 * poder reutilizá-lo: assim `yarn dev` e `yarn build` falham antes de subir.
 */

const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const isApiBase = (value: string) =>
  (value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value);

export const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string({ error: 'variável ausente' })
    .trim()
    .min(1, 'variável vazia')
    .refine(isApiBase, 'use um caminho (/api/v1) ou uma URL http(s) completa'),
  VITE_SERVER_URL: z
    .string()
    .trim()
    .refine((value) => value === '' || isHttpUrl(value), 'use uma URL http(s) completa')
    .optional(),
  VITE_ASSETS_DIR: z.string().trim().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ----------------------------------------------------------------------

/** Valida o env e, se faltar algo, lança um erro que diz qual variável e como corrigir. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Variáveis de ambiente inválidas:\n${details}\n` +
      'Copie o .env.example para .env e ajuste os valores (veja o README do front).'
  );
}

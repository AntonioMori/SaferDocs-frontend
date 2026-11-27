import * as z from 'zod';

// ----------------------------------------------------------------------

/**
 * Sem JIT no Zod: por padrão ele testa `new Function("")` na primeira validação para compilar
 * os validadores, e a CSP (REQ-37) não tem 'unsafe-eval', então o navegador registra uma
 * violação. No modo `jitless` o Zod valida do mesmo jeito, só sem gerar código.
 *
 * Importado antes de tudo no `main.tsx`.
 */
z.config({ jitless: true });

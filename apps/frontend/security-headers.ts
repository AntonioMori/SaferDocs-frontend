// ----------------------------------------------------------------------

/**
 * Cabeçalhos de segurança do front (REQ-37 a 44), usados no dev server e no preview do Vite.
 * No deploy, o nginx deve mandar os mesmos valores (veja "CSP e headers" no README).
 *
 * A CSP é a mais fechada que o front aceita:
 * - `script-src 'self'`: sem script inline e sem CDN (o worker do pdf.js é empacotado pelo Vite);
 * - `style-src 'self' 'unsafe-inline'`: o Emotion/MUI injeta `<style>` em tempo de execução;
 * - `img-src ... blob: data:`: pré-visualização do PDF (canvas) e imagens pequenas inlinadas;
 * - `font-src 'self' data:`: fontes locais (@fontsource), inlinadas pelo Vite quando pequenas;
 * - `connect-src 'self'`: a API é chamada pela mesma origem (`/api`, via proxy ou nginx);
 * - `worker-src 'self' blob:`: worker do pdf.js.
 */
const STRICT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * O dev server injeta um script inline (preâmbulo do React Fast Refresh) e abre um WebSocket
 * de HMR, então só o `vite dev` relaxa `script-src` e `connect-src`. O preview e o build usam a
 * CSP fechada, e é com ela que o console deve ficar sem violações.
 */
const DEV_CSP = STRICT_CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace(
  "connect-src 'self'",
  "connect-src 'self' ws: wss:"
);

const COMMON_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const devHeaders = { ...COMMON_HEADERS, 'Content-Security-Policy': DEV_CSP };

export const previewHeaders = { ...COMMON_HEADERS, 'Content-Security-Policy': STRICT_CSP };

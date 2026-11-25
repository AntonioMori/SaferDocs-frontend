// ----------------------------------------------------------------------

/**
 * Access token da sessão atual, guardado só em memória (REQ-20).
 *
 * Nunca vai para `localStorage`, `sessionStorage` ou cookie legível pelo JS: um script injetado
 * não encontra o token em nenhum armazenamento do navegador, e fechar a aba o descarta. Ao
 * recarregar a página, a sessão volta pelo `POST /auth/refresh`, que usa o refresh token do
 * cookie HttpOnly (o JS nunca o lê).
 *
 * Fica num módulo sem dependências para o cliente HTTP e o provider de autenticação poderem
 * usá-lo sem import circular.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

import type { TokenResponse } from 'src/auth/types';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * `PUT /auth/password` (REQ-25). O backend encerra todas as sessões anteriores, inclusive o
 * access atual, e devolve um par novo para esta. Quem chama abre a sessão nova com `signIn`.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<TokenResponse> {
  const { data } = await axios.put<TokenResponse>(endpoints.auth.password, {
    current_password: currentPassword,
    new_password: newPassword,
  });

  return data;
}

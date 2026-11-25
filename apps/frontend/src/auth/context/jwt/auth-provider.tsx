import type { AuthUser, AuthState, TokenResponse } from '../../types';

import { useMemo, useState, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';
import { setSession, refreshSession } from './utils';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/**
 * Estado da autenticação (REQ-20). O usuário e o access token vivem só em memória; ao montar,
 * o provider tenta recuperar a sessão pelo cookie do refresh, e é isso que mantém o login no F5.
 */
export function AuthProvider({ children }: Props) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const data = await refreshSession();

      setState({ user: data.user, loading: false });
    } catch {
      // Sem cookie ou refresh inválido: só não há sessão. Sem log do erro, pois um ApiError
      // carrega a requisição original na `cause`.
      setState({ user: null, loading: false });
    }
  }, [setState]);

  const signIn = useCallback(
    (data: TokenResponse) => {
      setSession(data);
      setState({ user: data.user, loading: false });
    },
    [setState]
  );

  const signOut = useCallback(async () => {
    try {
      await axios.post(endpoints.auth.signOut);
    } catch {
      // A sessão local acaba de qualquer jeito. Sem log: o ApiError carrega a requisição na `cause`.
    } finally {
      // Sai da memória o token e o usuário. As telas logadas desmontam e o AuthGuard leva ao login,
      // inclusive se o usuário voltar no histórico.
      setSession(null);
      setState({ user: null, loading: false });
    }
  }, []);

  const updateUser = useCallback(
    (patch: Partial<AuthUser>) => {
      setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, ...patch } } : prev));
    },
    [setState]
  );

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      signIn,
      signOut,
      updateUser,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, signIn, signOut, updateUser, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}

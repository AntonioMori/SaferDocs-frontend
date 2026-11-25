/** Usuário autenticado, como a API devolve (`UserOut`). */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  totp_enabled: boolean;
};

export type UserType = AuthUser | null;

/** Resposta de login, refresh e troca de senha (`TokenOut`). O refresh token fica só no cookie. */
export type TokenResponse = {
  access_token: string;
  token_type: string;
  /** Validade do access token, em segundos. */
  expires_in: number;
  user: AuthUser;
  /** Eventos de segurança ainda não vistos (REQ-58). */
  unseen_security_events: number;
};

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  /** Recupera a sessão pelo cookie do refresh (F5, nova aba). */
  checkUserSession: () => Promise<void>;
  /** Abre a sessão com a resposta de um login (senha, TOTP ou passkey). */
  signIn: (data: TokenResponse) => void;
  /** Atualiza os dados do usuário em memória (ex.: depois de ativar o 2FA). */
  updateUser: (patch: Partial<AuthUser>) => void;
};

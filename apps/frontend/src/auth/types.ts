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

/** Senha certa numa conta com 2FA: ainda sem token, só o desafio do segundo passo (REQ-15). */
export type MfaRequiredResponse = {
  mfa_required: true;
  /** Opaco, de uso único, vale só para `POST /auth/login/totp`. Fica só em memória. */
  mfa_token: string;
  /** Validade do desafio, em segundos. */
  expires_in: number;
};

export type LoginResponse = TokenResponse | MfaRequiredResponse;

export const isMfaRequired = (data: LoginResponse): data is MfaRequiredResponse =>
  'mfa_required' in data && data.mfa_required === true;

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
  /**
   * Logout (REQ-21): `POST /auth/logout` (o access vai para a denylist e o cookie do refresh é
   * apagado) e limpeza do estado em memória. A sessão local termina mesmo se a API falhar.
   */
  signOut: () => Promise<void>;
  /** Atualiza os dados do usuário em memória (ex.: depois de ativar o 2FA). */
  updateUser: (patch: Partial<AuthUser>) => void;
};

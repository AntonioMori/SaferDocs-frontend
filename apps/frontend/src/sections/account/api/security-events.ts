import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type SecurityEventType =
  | 'NEW_IP_LOGIN'
  | 'TOTP_ENABLED'
  | 'TOTP_DISABLED'
  | 'PASSWORD_CHANGED'
  | 'TOTP_FAILURES'
  | 'IP_CHANGED'
  | 'REFRESH_TOKEN_REUSE'
  | 'PASSKEY_COUNTER_MISMATCH';

export type SecurityEvent = {
  id: string;
  /** Tipo conhecido ou um novo que o backend venha a criar. */
  type: SecurityEventType | (string & {});
  created_at: string;
  seen: boolean;
  /** `ip` e `user_agent` da requisição, e dados do tipo (ex.: `failures`). Sem segredos. */
  details: Record<string, unknown> | null;
};

/** `GET /security/events`: até 100 eventos, os não vistos primeiro. */
export async function listSecurityEvents(): Promise<SecurityEvent[]> {
  const { data } = await axios.get<SecurityEvent[]>(endpoints.security.events);

  return data;
}

/** `POST /security/events/seen` (204): marca como vistos (de 1 a 100 ids por chamada). */
export async function markSecurityEventsSeen(ids: string[]): Promise<void> {
  for (let start = 0; start < ids.length; start += 100) {
    // Em sequência: são poucas chamadas e a ordem não importa.
     
    await axios.post(endpoints.security.seen, { ids: ids.slice(start, start + 100) });
  }
}

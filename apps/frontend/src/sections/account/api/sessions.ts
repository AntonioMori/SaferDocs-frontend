import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type SessionItem = {
  id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_seen_at: string;
  /** A sessão desta aba. */
  current: boolean;
};

/** `GET /sessions`: sessões ativas, a mais recente primeiro. */
export async function listSessions(): Promise<SessionItem[]> {
  const { data } = await axios.get<SessionItem[]>(endpoints.sessions.list);

  return data;
}

/** `DELETE /sessions/{id}` (204). Encerrar a própria sessão também apaga o cookie do refresh. */
export async function revokeSession(id: string): Promise<void> {
  await axios.delete(endpoints.sessions.item(id));
}

/** `DELETE /sessions` (204): "sair de todos os dispositivos", inclusive deste. */
export async function revokeAllSessions(): Promise<void> {
  await axios.delete(endpoints.sessions.list);
}

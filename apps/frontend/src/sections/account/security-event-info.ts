import type { SecurityEvent } from './api/security-events';
import type { IconifyName } from 'src/components/iconify/register-icons';

// ----------------------------------------------------------------------

type Severity = 'info' | 'warning' | 'error';

export type SecurityEventInfo = {
  title: string;
  description: string;
  severity: Severity;
  icon: IconifyName;
};

const asNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Texto e destaque de cada tipo de evento de segurança (REQ-58). */
export function securityEventInfo(event: SecurityEvent): SecurityEventInfo {
  const failures = asNumber(event.details?.failures);
  const minutes = asNumber(event.details?.window_minutes);

  switch (event.type) {
    case 'NEW_IP_LOGIN':
      return {
        title: 'Login a partir de um endereço novo',
        description: 'Sua conta foi acessada de um IP que ela nunca tinha usado.',
        severity: 'warning',
        icon: 'solar:danger-triangle-bold',
      };
    case 'IP_CHANGED':
      return {
        title: 'Sessão usada a partir de outro endereço',
        description: 'Uma sessão aberta passou a ser usada de um IP diferente do login.',
        severity: 'warning',
        icon: 'solar:danger-triangle-bold',
      };
    case 'TOTP_FAILURES':
      return {
        title: 'Códigos de verificação errados',
        description:
          failures && minutes
            ? `${failures} códigos errados em ${minutes} minutos, depois de a senha estar certa. Se não foi você, troque a senha.`
            : 'Vários códigos errados depois de a senha estar certa. Se não foi você, troque a senha.',
        severity: 'warning',
        icon: 'solar:danger-bold',
      };
    case 'REFRESH_TOKEN_REUSE':
      return {
        title: 'Possível roubo de sessão',
        description:
          'Um token de sessão já usado foi apresentado de novo. Por segurança, as sessões foram encerradas.',
        severity: 'error',
        icon: 'solar:forbidden-circle-bold',
      };
    case 'PASSKEY_COUNTER_MISMATCH':
      return {
        title: 'Possível passkey clonada',
        description: 'Uma passkey se apresentou com o contador fora de ordem. Revise suas passkeys.',
        severity: 'error',
        icon: 'solar:forbidden-circle-bold',
      };
    case 'TOTP_ENABLED':
      return {
        title: 'Verificação em duas etapas ativada',
        description: 'O login passou a pedir o código do app autenticador.',
        severity: 'info',
        icon: 'solar:shield-check-bold',
      };
    case 'TOTP_DISABLED':
      return {
        title: 'Verificação em duas etapas desativada',
        description: 'O login deixou de pedir o código do app autenticador.',
        severity: 'warning',
        icon: 'solar:shield-keyhole-bold-duotone',
      };
    case 'PASSWORD_CHANGED':
      return {
        title: 'Senha alterada',
        description: 'A senha foi trocada e as outras sessões foram encerradas.',
        severity: 'info',
        icon: 'solar:lock-password-outline',
      };
    default:
      return {
        title: 'Evento de segurança',
        description: String(event.type),
        severity: 'info',
        icon: 'solar:info-circle-bold',
      };
  }
}

/** Origem do evento (IP e navegador), quando o backend a registrou. */
export function securityEventOrigin(event: SecurityEvent): { ip: string | null; userAgent: string | null } {
  const ip = typeof event.details?.ip === 'string' ? event.details.ip : null;
  const userAgent = typeof event.details?.user_agent === 'string' ? event.details.user_agent : null;

  return { ip, userAgent };
}

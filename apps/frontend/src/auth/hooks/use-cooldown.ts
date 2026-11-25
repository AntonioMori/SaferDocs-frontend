import { useState, useEffect, useCallback } from 'react';

// ----------------------------------------------------------------------

/** Espera padrão do 429 quando o servidor não informa o `Retry-After`. */
export const DEFAULT_COOLDOWN_SECONDS = 30;

/**
 * Contagem regressiva em segundos, para segurar o botão de envio depois de um 429 (REQ-05).
 * `start(segundos)` começa a contar; `seconds` chega a 0 quando a espera acaba.
 */
export function useCooldown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return undefined;

    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  const start = useCallback((value: number | undefined) => {
    setSeconds(Math.max(1, Math.ceil(value ?? DEFAULT_COOLDOWN_SECONDS)));
  }, []);

  return { seconds, active: seconds > 0, start };
}

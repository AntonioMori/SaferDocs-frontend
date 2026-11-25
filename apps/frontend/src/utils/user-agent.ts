// ----------------------------------------------------------------------

export type DeviceKind = 'mobile' | 'desktop';

export type DeviceInfo = {
  /** `Chrome no Windows`, `Safari no iPhone`... */
  label: string;
  kind: DeviceKind;
};

const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/HeadlessChrome\//, 'Chrome (automatizado)'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

/**
 * Resumo legível do User-Agent para a lista de sessões. É só uma pista para a pessoa reconhecer
 * o dispositivo: o User-Agent é informado pelo próprio cliente e pode ser falso.
 */
export function describeUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) return { label: 'Dispositivo desconhecido', kind: 'desktop' };

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const kind: DeviceKind = /Mobi|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';

  if (browser && system) return { label: `${browser} no ${system}`, kind };
  if (browser || system) return { label: (browser ?? system) as string, kind };

  return { label: 'Outro cliente', kind };
}

import { paths } from 'src/routes/paths';

import { parseEnv } from './env-schema';
import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  assetsDir: string;
  auth: {
    skip: boolean;
    redirectPath: string;
  };
};

// ----------------------------------------------------------------------

/**
 * Falha na inicialização, com mensagem clara, se uma variável obrigatória faltar ou for inválida.
 *
 * Passa só as chaves usadas pelo front. Entregar `import.meta.env` inteiro faria o Vite embutir
 * todas as variáveis `VITE_*` no bundle, inclusive `VITE_SERVER_URL`, que só o `vite.config.ts` lê.
 */
const env = parseEnv({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ASSETS_DIR: import.meta.env.VITE_ASSETS_DIR,
});

export const CONFIG: ConfigValue = {
  appName: 'SaferDocs',
  appVersion: packageJson.version,
  apiBaseUrl: env.VITE_API_BASE_URL,
  assetsDir: env.VITE_ASSETS_DIR ?? '',
  auth: {
    skip: false,
    redirectPath: paths.assinar,
  },
};

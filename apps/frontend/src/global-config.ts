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

/** Falha na inicialização, com mensagem clara, se uma variável obrigatória faltar ou for inválida. */
const env = parseEnv(import.meta.env);

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

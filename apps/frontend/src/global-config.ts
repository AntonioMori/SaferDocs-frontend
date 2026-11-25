import { paths } from 'src/routes/paths';

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

export const CONFIG: ConfigValue = {
  appName: 'SaferDocs',
  appVersion: packageJson.version,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  auth: {
    skip: false,
    redirectPath: paths.assinar,
  },
};

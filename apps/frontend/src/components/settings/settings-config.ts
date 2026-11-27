import type { SettingsState } from './types';

import { CONFIG } from 'src/global-config';
import { themeConfig } from 'src/theme/theme-config';

// ----------------------------------------------------------------------

/**
 * O navegador grava as configurações já no primeiro acesso, com os padrões daquele momento. Trocar
 * a chave (era `app-settings`) faz todo mundo abrir uma vez com os padrões atuais: menu "aparente"
 * e contraste alto. Ao mudar um padrão de novo, troque o sufixo.
 */
export const SETTINGS_STORAGE_KEY: string = 'saferdocs-settings-v2';

export const defaultSettings: SettingsState = {
  mode: themeConfig.defaultMode,
  direction: themeConfig.direction,
  contrast: 'high',
  navLayout: 'vertical',
  primaryColor: 'default',
  navColor: 'apparent',
  compactLayout: true,
  fontSize: 16,
  fontFamily: themeConfig.fontFamily.primary,
  version: CONFIG.appVersion,
};

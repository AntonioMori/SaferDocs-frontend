import type { Theme, CSSObject } from '@mui/material/styles';
import type { SettingsState } from 'src/components/settings';

import { varAlpha } from 'minimal-shared/utils';

import { bulletColor } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme) {
  return {
    '--layout-transition-easing': 'linear',
    '--layout-transition-duration': '120ms',
    '--layout-nav-mini-width': '88px',
    '--layout-nav-vertical-width': '300px',
    '--layout-nav-horizontal-height': '64px',
    '--layout-dashboard-content-pt': theme.spacing(1),
    '--layout-dashboard-content-pb': theme.spacing(8),
    '--layout-dashboard-content-px': theme.spacing(5),
  };
}

// ----------------------------------------------------------------------

export function dashboardNavColorVars(
  theme: Theme,
  navColor: SettingsState['navColor'] = 'apparent',
  navLayout: SettingsState['navLayout'] = 'vertical'
): Record<'layout' | 'section', CSSObject | undefined> {
  const {
    vars: { palette },
  } = theme;

  switch (navColor) {
    case 'integrate':
      return {
        layout: {
          '--layout-nav-bg': palette.background.default,
          '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.8),
          '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.12),
          '--layout-nav-text-primary-color': palette.text.primary,
          '--layout-nav-text-secondary-color': palette.text.secondary,
          '--layout-nav-text-disabled-color': palette.text.disabled,
          ...theme.applyStyles('dark', {
            '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.08),
            '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.96),
          }),
        },
        section: undefined,
      };
    case 'apparent':
      // Menu azul em degradê no modo claro; no escuro volta aos tons padrão do tema.
      return {
        layout: {
          '--layout-nav-bg': 'linear-gradient(to bottom, #2c5cb4, #294f96)',
          '--layout-nav-horizontal-bg': varAlpha(palette.grey['900Channel'], 0.96),
          '--layout-nav-border-color': '#46474886',
          '--layout-nav-text-primary-color': '#ECF6FE',
          '--layout-nav-text-secondary-color': '#ECF6FE',
          '--layout-nav-text-disabled-color': 'rgba(236, 246, 254, 0.4)',
          ...theme.applyStyles('dark', {
            '--layout-nav-bg': palette.grey[800],
            '--layout-nav-horizontal-bg': varAlpha(palette.grey['800Channel'], 0.8),
            '--layout-nav-text-primary-color': palette.text.primary,
            '--layout-nav-text-secondary-color': palette.text.secondary,
            '--layout-nav-text-disabled-color': palette.text.disabled,
          }),
        },
        section: {
          // caption
          '--nav-item-caption-color': 'rgba(236, 246, 254, 0.6)',
          // subheader
          '--nav-subheader-color': 'rgba(236, 246, 254, 0.6)',
          '--nav-subheader-hover-color': '#ECF6FE',
          // item
          '--nav-item-color': '#ECF6FE',
          '--nav-item-hover-bg': 'rgba(236, 246, 254, 0.07)',
          '--nav-item-root-active-color': '#ECF6FE',
          '--nav-item-root-active-color-on-dark': palette.primary.light,
          '--nav-item-root-active-bg': 'rgba(236, 246, 254, 0.12)',
          '--nav-item-root-active-hover-bg': 'rgba(236, 246, 254, 0.18)',
          '--nav-item-root-open-color': '#ECF6FE',
          // bullet
          '--nav-bullet-light-color': 'rgba(236, 246, 254, 0.8)',
          // sub
          ...(navLayout === 'vertical' && {
            '--nav-item-sub-active-color': '#ECF6FE',
            '--nav-item-sub-active-bg': 'rgba(236, 246, 254, 0.10)',
            '--nav-item-sub-open-color': '#ECF6FE',
          }),
          // dark: volta aos padrões do tema escuro
          ...theme.applyStyles('dark', {
            '--nav-item-caption-color': palette.text.disabled,
            '--nav-subheader-color': palette.text.disabled,
            '--nav-subheader-hover-color': palette.text.primary,
            '--nav-item-color': palette.grey[500],
            '--nav-item-hover-bg': palette.action.hover,
            '--nav-item-root-active-color': palette.primary.main,
            '--nav-item-root-active-color-on-dark': palette.primary.light,
            '--nav-item-root-active-bg': varAlpha(palette.primary.mainChannel, 0.08),
            '--nav-item-root-active-hover-bg': varAlpha(palette.primary.mainChannel, 0.16),
            '--nav-item-root-open-color': palette.common.white,
            '--nav-bullet-light-color': bulletColor.dark,
            ...(navLayout === 'vertical' && {
              '--nav-item-sub-active-color': palette.common.white,
              '--nav-item-sub-active-bg': palette.action.hover,
              '--nav-item-sub-open-color': palette.common.white,
            }),
          }),
        },
      };
    default:
      throw new Error(`Invalid color: ${navColor}`);
  }
}

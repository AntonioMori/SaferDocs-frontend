import type { IconButtonProps } from '@mui/material/IconButton';

import { varAlpha } from 'minimal-shared/utils';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavToggleButtonProps = IconButtonProps & {
  isNavMini: boolean;
};

export function NavToggleButton({ isNavMini, sx, ...other }: NavToggleButtonProps) {
  return (
    <IconButton
      size="small"
      sx={[
        (theme) => ({
          p: 0.5,
          position: 'absolute',
          color: 'action.active',
          bgcolor: 'background.default',
          transform: 'translate(-50%, -50%)',
          zIndex: 'var(--layout-nav-zIndex)',
          top: 'calc(var(--layout-header-desktop-height) / 2)',
          left: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
          border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
          // Sombra larga e difusa: destaca o botão sobre o menu azul e sobre o conteúdo.
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.22), 0 1px 4px rgba(0, 0, 0, 0.12)',
          transition: theme.transitions.create(['left', 'box-shadow'], {
            easing: 'var(--layout-transition-easing)',
            duration: 'var(--layout-transition-duration)',
          }),
          '&:hover': {
            color: 'text.primary',
            bgcolor: 'background.neutral',
            boxShadow: '0 6px 22px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.14)',
          },
          ...theme.applyStyles('dark', {
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.55), 0 1px 4px rgba(0, 0, 0, 0.35)',
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        width={16}
        icon={isNavMini ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'}
        sx={(theme) => ({
          ...(theme.direction === 'rtl' && { transform: 'scaleX(-1)' }),
        })}
      />
    </IconButton>
  );
}

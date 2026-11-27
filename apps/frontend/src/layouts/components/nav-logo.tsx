import type { LogoProps } from 'src/components/logo';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { Logo, LogoMark } from 'src/components/logo';

// ----------------------------------------------------------------------

/**
 * Logo do menu lateral: o monograma e o nome do app. O nome usa a cor de texto do menu, para
 * ficar legível tanto no menu "aparente" (azul) quanto no "integrado" (claro).
 */
export function NavLogo({ sx, ...other }: LogoProps) {
  return (
    <Logo
      aria-label={CONFIG.appName}
      sx={[
        { width: 'auto', height: 'auto', alignItems: 'center', gap: 1.25 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box component="svg" viewBox="0 0 104 104" aria-hidden sx={{ width: 40, height: 40 }}>
        <LogoMark />
      </Box>
      <Typography
        component="span"
        sx={(theme) => ({
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: '-.01em',
          color: 'var(--layout-nav-text-primary-color)',
        })}
      >
        {CONFIG.appName}
      </Typography>
    </Logo>
  );
}

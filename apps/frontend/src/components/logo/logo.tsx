import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

/** Cores fixas da marca SaferDocs: não seguem a cor primária do tema. */
const BRAND_BLUE = '#078DEE';
const BRAND_AMBER = '#F9AF1D';

/** Monograma: quadrado azul, "S" branco e o ponto âmbar do lacre. Desenhado em 104 x 104. */
function LogoMark() {
  return (
    <>
      <rect width="104" height="104" rx="26" fill={BRAND_BLUE} />
      <path
        d="M74 30C68 20 30 18 30 40C30 60 74 52 74 70C74 90 36 86 28 74"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="86" cy="86" r="9" fill={BRAND_AMBER} />
    </>
  );
}

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();

  const singleLogo = (
    <svg width="100%" height="100%" viewBox="0 0 104 104" xmlns="http://www.w3.org/2000/svg">
      <LogoMark />
    </svg>
  );

  const fullLogo = (
    <svg width="100%" height="100%" viewBox="0 0 400 104" xmlns="http://www.w3.org/2000/svg">
      <LogoMark />
      <text
        x="124"
        y="70"
        fill={theme.vars.palette.text.primary}
        fontFamily={theme.typography.fontFamily}
        fontSize="52"
        fontWeight="700"
        letterSpacing="-1"
      >
        SaferDocs
      </text>
    </svg>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="SaferDocs"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 138, height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));

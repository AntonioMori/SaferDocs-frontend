import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { PASSWORD_RULES } from 'src/lib/password-policy';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type PasswordRulesProps = BoxProps & {
  password: string;
};

/**
 * Indicador da política de senhas (REQ-01): cada regra fica verde quando cumprida. Anunciado por
 * leitor de tela (`aria-live`) à medida que a pessoa digita.
 */
export function PasswordRules({ password, sx, ...other }: PasswordRulesProps) {
  return (
    <Box
      component="ul"
      aria-label="Regras da senha"
      aria-live="polite"
      sx={[
        { m: 0, p: 0, gap: 0.75, display: 'grid', listStyle: 'none' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);

        return (
          <Box
            key={rule.id}
            component="li"
            data-rule={rule.id}
            data-ok={ok}
            sx={(theme) => ({
              gap: 1,
              display: 'flex',
              alignItems: 'center',
              color: ok ? theme.vars.palette.success.main : theme.vars.palette.text.disabled,
              transition: theme.transitions.create('color'),
            })}
          >
            <Iconify width={18} icon={ok ? 'solar:check-circle-bold' : 'eva:radio-button-off-fill'} />
            <Typography variant="body2" component="span" sx={{ color: ok ? 'text.primary' : 'text.secondary' }}>
              {rule.label}
              <Box component="span" sx={visuallyHidden}>
                {ok ? ' (cumprida)' : ' (pendente)'}
              </Box>
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const;

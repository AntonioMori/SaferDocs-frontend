import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type FormHeadProps = BoxProps & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
};

/** Cabeçalho das telas de entrada: título grande alinhado à esquerda, como no painel. */
export function FormHead({ sx, icon, title, description, ...other }: FormHeadProps) {
  return (
    <>
      {icon && (
        <Box component="span" sx={{ mb: 3, display: 'inline-flex' }}>
          {icon}
        </Box>
      )}

      <Box
        sx={[
          () => ({
            mb: 3,
            gap: 1,
            display: 'flex',
            whiteSpace: 'pre-line',
            flexDirection: 'column',
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Typography
          component="h2"
          sx={(theme) => ({
            m: 0,
            fontFamily: theme.typography.fontFamily,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1.2,
          })}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            component="div"
            sx={{ fontSize: 15, lineHeight: '24px', color: 'text.secondary' }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </>
  );
}

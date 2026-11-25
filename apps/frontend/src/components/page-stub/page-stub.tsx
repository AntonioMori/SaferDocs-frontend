import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

const ALL_LINKS = [
  { label: 'Entrar', href: paths.entrar },
  { label: 'Cadastro', href: paths.cadastro },
  { label: '2FA', href: paths.doisFatores },
  { label: 'Assinar', href: paths.assinar },
  { label: 'Verificar', href: paths.verificar },
  { label: 'Segurança da conta', href: paths.conta.seguranca },
  { label: 'Sessões', href: paths.conta.sessoes },
  { label: 'Passkeys', href: paths.conta.passkeys },
];

export type PageStubProps = {
  title: string;
  description?: string;
  sx?: SxProps<Theme>;
};

/**
 * Corpo provisório das páginas vazias da fundação (RNF-03).
 * Cada issue de funcionalidade troca este componente pela tela real.
 */
export function PageStub({ title, description, sx }: PageStubProps) {
  return (
    <Box sx={sx}>
      <Typography variant="h4">{title}</Typography>

      {description && (
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>{description}</Typography>
      )}

      <Stack direction="row" sx={{ mt: 3, gap: 2, flexWrap: 'wrap' }}>
        {ALL_LINKS.map((item) => (
          <Link key={item.href} component={RouterLink} href={item.href} variant="body2">
            {item.label}
          </Link>
        ))}
      </Stack>
    </Box>
  );
}

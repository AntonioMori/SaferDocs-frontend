import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const LINKS = [
  { label: 'Segurança da conta', href: paths.conta.seguranca, icon: 'solar:shield-keyhole-bold-duotone' },
  { label: 'Sessões ativas', href: paths.conta.sessoes, icon: 'solar:monitor-bold' },
  { label: 'Passkeys', href: paths.conta.passkeys, icon: 'solar:user-id-bold' },
] as const;

/** Iniciais do nome para o avatar (até duas letras). */
function initials(name: string | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;

  return letters.map((part) => Array.from(part)[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * Menu da conta no cabeçalho da área logada: quem está logado, atalhos da conta e "Sair" (REQ-21).
 */
export function AccountMenu() {
  const { user, signOut } = useAuthContext();
  const { open, anchorEl, onClose, onOpen } = usePopover();

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    onClose();

    await signOut();
    toast.success('Você saiu da sua conta.');
  };

  return (
    <>
      <IconButton
        onClick={onOpen}
        aria-label="Abrir menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{ p: 0.25 }}
      >
        <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'primary.main' }}>
          {initials(user?.name)}
        </Avatar>
      </IconButton>

      <CustomPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        slotProps={{ arrow: { placement: 'top-right' }, paper: { sx: { width: 240 } } }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.name}
          </Typography>
          <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList>
          {LINKS.map((link) => (
            <MenuItem key={link.href} component={RouterLink} href={link.href} onClick={onClose}>
              <Iconify icon={link.icon} />
              {link.label}
            </MenuItem>
          ))}
        </MenuList>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList>
          <MenuItem onClick={handleSignOut} disabled={signingOut} sx={{ color: 'error.main' }}>
            <Iconify icon="ic:round-power-settings-new" />
            Sair
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Menu lateral da área logada. Cada item aponta para uma página da fundação (RNF-03).
 */
export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Documentos',
    items: [
      {
        title: 'Assinar',
        path: paths.assinar,
        icon: <Iconify width={24} icon="solar:file-bold-duotone" />,
      },
      {
        title: 'Verificar',
        path: paths.verificar,
        icon: <Iconify width={24} icon="solar:file-check-bold-duotone" />,
      },
    ],
  },
  {
    subheader: 'Conta',
    items: [
      {
        title: 'Segurança',
        path: paths.conta.seguranca,
        icon: <Iconify width={24} icon="solar:shield-keyhole-bold-duotone" />,
      },
      {
        title: 'Sessões',
        path: paths.conta.sessoes,
        icon: <Iconify width={24} icon="solar:monitor-bold" />,
      },
      {
        title: 'Passkeys',
        path: paths.conta.passkeys,
        icon: <Iconify width={24} icon="solar:user-id-bold" />,
      },
    ],
  },
];

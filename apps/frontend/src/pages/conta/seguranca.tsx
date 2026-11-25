import { CONFIG } from 'src/global-config';

import { SegurancaView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Segurança da conta | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SegurancaView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { DoisFatoresView } from 'src/auth/view';

// ----------------------------------------------------------------------

const metadata = { title: `Verificação em duas etapas | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <DoisFatoresView />
    </>
  );
}

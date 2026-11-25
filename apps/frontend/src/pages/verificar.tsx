import { CONFIG } from 'src/global-config';

import { VerificarView } from 'src/sections/verify/view';

// ----------------------------------------------------------------------

const metadata = { title: `Verificar documento | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <VerificarView />
    </>
  );
}

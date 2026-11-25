import { CONFIG } from 'src/global-config';

import { AtividadeView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Atividade de segurança | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AtividadeView />
    </>
  );
}

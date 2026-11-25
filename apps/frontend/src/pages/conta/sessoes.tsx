import { CONFIG } from 'src/global-config';

import { SessoesView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Sessões ativas | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SessoesView />
    </>
  );
}

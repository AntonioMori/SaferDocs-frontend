import { CONFIG } from 'src/global-config';

import { CadastroView } from 'src/auth/view';

// ----------------------------------------------------------------------

const metadata = { title: `Cadastro | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CadastroView />
    </>
  );
}

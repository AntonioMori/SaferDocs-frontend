import { CONFIG } from 'src/global-config';

import { LoginView } from 'src/auth/view';

// ----------------------------------------------------------------------

const metadata = { title: `Entrar | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <LoginView />
    </>
  );
}

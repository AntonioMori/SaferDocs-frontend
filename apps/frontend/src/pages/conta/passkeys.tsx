import { CONFIG } from 'src/global-config';

import { PasskeysView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Passkeys | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PasskeysView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { AssinarView } from 'src/sections/sign/view';

// ----------------------------------------------------------------------

const metadata = { title: `Assinar documento | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AssinarView />
    </>
  );
}

import path from 'path';
import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

// ----------------------------------------------------------------------

const PORT = 3039;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Em dev e no preview, `/api` vai para o backend: front e API ficam na mesma origem (RNF-01).
  const proxy = env.VITE_SERVER_URL
    ? { '/api': { target: env.VITE_SERVER_URL, changeOrigin: false } }
    : undefined;

  return {
    plugins: [
      react(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        },
        overlay: {
          position: 'tl',
          initialIsOpen: false,
        },
      }),
    ],
    resolve: {
      alias: [
        {
          find: /^src(.+)/,
          replacement: path.resolve(process.cwd(), 'src/$1'),
        },
      ],
    },
    server: { port: PORT, host: true, proxy },
    preview: { port: PORT, host: true, proxy },
  };
});

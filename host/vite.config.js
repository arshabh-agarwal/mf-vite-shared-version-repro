import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

const requiredVersion = process.env.HOST_REQUIRED_VERSION ?? '^19.3.1';

export default defineConfig({
  preview: { port: 4173, strictPort: true },
  plugins: [
    federation({
      name: 'host',
      dts: false,
      shareStrategy: process.env.SHARE_STRATEGY ?? 'version-first',
      remotes: {
        remote: {
          type: 'module',
          name: 'remote',
          entry: 'http://localhost:4174/mf-manifest.json',
        },
      },
      shared: {
        react: { singleton: false, requiredVersion },
        'react-dom': { singleton: false, requiredVersion },
      },
    }),
  ],
});

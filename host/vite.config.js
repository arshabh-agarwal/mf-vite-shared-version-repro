import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

export default defineConfig({
  preview: { port: 4173, strictPort: true },
  plugins: [
    federation({
      name: 'host',
      dts: false,
      remotes: {
        remote: {
          type: 'module',
          name: 'remote',
          entry: 'http://localhost:4174/mf-manifest.json',
        },
      },
      shared: {
        react: { singleton: false, requiredVersion: '^19.3.1' },
        'react-dom': { singleton: false, requiredVersion: '^19.3.1' },
      },
    }),
  ],
});

import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

const requiredVersion = process.env.REMOTE_REQUIRED_VERSION ?? '^19.0.0';

export default defineConfig({
  preview: { port: 4174, strictPort: true, cors: true },
  base: 'http://localhost:4174/',
  plugins: [
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      shareStrategy: process.env.SHARE_STRATEGY ?? 'version-first',
      exposes: { './App': './src/App.js' },
      shared: {
        react: { singleton: false, requiredVersion },
        'react-dom': { singleton: false, requiredVersion },
      },
    }),
  ],
});

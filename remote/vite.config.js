import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

export default defineConfig({
  preview: { port: 4174, strictPort: true, cors: true },
  base: 'http://localhost:4174/',
  plugins: [
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: { './App': './src/App.js' },
      shared: {
        react: { singleton: false, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: false, requiredVersion: '^19.0.0' },
      },
    }),
  ],
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    server: {
      proxy: {
        // Target your Node.js backend (dev server only)
        '/api-proxy': 'http://localhost:5000',
        '/ws-proxy': { target: 'ws://localhost:5000', ws: true },
      },
    },
    plugins: react(),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

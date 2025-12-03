import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          // Proxy API requests to backend server on port 3000
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
            ws: true, // Enable WebSocket proxy
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('Proxy error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Proxying request:', req.method, req.url);
              });
            },
          }
        }
      },
      plugins: [react()],
      // Vite automatically exposes VITE_* env vars via import.meta.env
      // No need to manually define them here
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

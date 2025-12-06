import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // When using middleware mode in server.js, Vite config is still needed
      // but server settings are handled by Express
      // This config is used when Vite is created in middleware mode
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

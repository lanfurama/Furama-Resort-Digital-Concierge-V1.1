import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      // Vite tự động expose các biến có prefix VITE_ vào import.meta.env
      // Không cần define thủ công, chỉ cần đảm bảo VITE_GEMINI_API_KEY được set trong environment
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

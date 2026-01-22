import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        server: {
            allowedHosts: [
                'data.horecfex.com', // Thêm domain của bạn vào đây
                'localhost',          // Nếu bạn muốn chấp nhận localhost
                '0.0.0.0',            // Để chấp nhận tất cả các địa chỉ IP
            ],
        },
        // SPA fallback for client-side routing
        build: {
            rollupOptions: {
                input: {
                    main: './index.html',
                },
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                        'vendor-ui': ['lucide-react'],
                        'vendor-ai': ['@google/genai'],
                    },
                },
            },
            chunkSizeWarningLimit: 1000,
        },
    };
});

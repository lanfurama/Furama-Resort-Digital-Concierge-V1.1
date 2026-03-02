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
                    manualChunks: (id) => {
                        // Vendor chunks
                        if (id.includes('node_modules')) {
                            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                                return 'vendor-react';
                            }
                            if (id.includes('lucide-react')) {
                                return 'vendor-ui';
                            }
                            if (id.includes('@google/genai')) {
                                return 'vendor-ai';
                            }
                            // Other node_modules
                            return 'vendor';
                        }
                        // Driver module chunk
                        if (id.includes('components/driver') || id.includes('driver/hooks')) {
                            return 'driver-module';
                        }
                        // Admin module chunk
                        if (id.includes('components/admin') || id.includes('hooks/useAdmin')) {
                            return 'admin-module';
                        }
                        // Shared components
                        if (id.includes('components/') && !id.includes('driver') && !id.includes('admin')) {
                            return 'shared-components';
                        }
                    },
                },
            },
            chunkSizeWarningLimit: 1000,
        },
    };
});

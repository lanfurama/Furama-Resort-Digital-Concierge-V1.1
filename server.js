import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import routes from './api/_routes/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Log environment info
console.log(`🔍 Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaults to development)'}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Furama Resort Digital Concierge API is running' });
});

// API routes with /api/v1 prefix
app.use('/api/v1', routes);

// 404 handler for API routes (must be before Vite middleware)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Variable to store Vite instance
let vite = null;

// Setup Vite dev server middleware in development
async function setupVite() {
  if (isDev) {
    try {
      console.log('🔧 Setting up Vite dev server in middleware mode...');
      vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      // Use vite's middleware to handle all non-API requests
      app.use(vite.middlewares);
      console.log('✅ Vite dev server middleware configured');
    } catch (error) {
      console.error('❌ Failed to setup Vite:', error);
      throw error;
    }
  } else {
    console.log('📦 Production mode: serving static files from dist/');
    // In production, serve static files
    // This will be handled by Vercel or your production server
    const path = await import('path');
    const { existsSync } = await import('fs');
    const distPath = path.default.join(process.cwd(), 'dist');
    
    if (existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        // Only serve static files in production mode
        if (!isDev) {
          res.sendFile('index.html', { root: distPath });
        } else {
          next();
        }
      });
    } else {
      console.warn('⚠️  dist folder not found. Make sure to run "npm run build" first.');
    }
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Export for Vercel serverless functions
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  setupVite()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📡 API endpoints available at http://localhost:${PORT}/api/v1`);
        console.log(`💚 Health check: http://localhost:${PORT}/health`);
        if (isDev) {
          console.log(`⚡ Vite dev server integrated`);
          console.log(`🌐 Frontend available at http://localhost:${PORT}`);
        }
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createServer as createViteServer } from 'vite';
import routes from './api/_routes/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// Nếu HTTPS_PORT không được set, sử dụng PORT (3000) cho HTTPS
const HTTPS_PORT = process.env.HTTPS_PORT || PORT;
const isDev = process.env.NODE_ENV !== 'production';

// HTTPS Configuration
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || join(process.cwd(), 'certs', 'server.key');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || join(process.cwd(), 'certs', 'server.crt');

let httpsOptions = null;
if (ENABLE_HTTPS) {
  try {
    if (existsSync(SSL_KEY_PATH) && existsSync(SSL_CERT_PATH)) {
      httpsOptions = {
        key: readFileSync(SSL_KEY_PATH),
        cert: readFileSync(SSL_CERT_PATH),
      };
      console.log('🔐 HTTPS enabled - SSL certificates loaded');
    } else {
      console.warn('⚠️  HTTPS enabled but certificates not found!');
      console.warn(`   Key: ${SSL_KEY_PATH}`);
      console.warn(`   Cert: ${SSL_CERT_PATH}`);
      console.warn('   Run "npm run generate-ssl" to generate certificates');
      console.warn('   Falling back to HTTP mode');
    }
  } catch (error) {
    console.error('❌ Error loading SSL certificates:', error.message);
    console.error('   Falling back to HTTP mode');
  }
}

// Log environment info
console.log(`🔍 Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaults to development)'}`);

// Middleware
app.use((req, res, next) => {
  console.log(`🌍 [Global] ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for API routes
app.use('/api/v1', (req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl || req.url}`, {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Furama Resort Digital Concierge API is running' });
});

// API routes with /api/v1 prefix
console.log('🔌 Registering API routes...', routes);
app.use('/api/v1', routes);
console.log('✅ API routes registered');

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
      // SPA fallback: serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
          return next();
        }
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
      if (ENABLE_HTTPS && httpsOptions) {
        // Create HTTPS server
        const httpsServer = https.createServer(httpsOptions, app);

        // Optional: Create HTTP server to redirect to HTTPS
        if (process.env.HTTPS_REDIRECT === 'true') {
          const httpServer = http.createServer((req, res) => {
            const httpsUrl = `https://${req.headers.host?.replace(`:${PORT}`, `:${HTTPS_PORT}`)}${req.url}`;
            res.writeHead(301, { Location: httpsUrl });
            res.end();
          });

          httpServer.listen(PORT, () => {
            console.log(`🔄 HTTP redirect server running on http://localhost:${PORT}`);
            console.log(`   Redirecting to https://localhost:${HTTPS_PORT}`);
          });
        }

        httpsServer.listen(HTTPS_PORT, () => {
          console.log(`🔐 HTTPS Server is running on https://localhost:${HTTPS_PORT}`);
          console.log(`📡 API endpoints available at https://localhost:${HTTPS_PORT}/api/v1`);
          console.log(`💚 Health check: https://localhost:${HTTPS_PORT}/health`);
          if (isDev) {
            console.log(`⚡ Vite dev server integrated`);
            console.log(`🌐 Frontend available at https://localhost:${HTTPS_PORT}`);
          }
          console.log(`\n⚠️  Using self-signed certificate - browser will show security warning`);
          console.log(`   Click "Advanced" → "Proceed to localhost" to continue\n`);
        });
      } else {
        // Create HTTP server (default)
        app.listen(PORT, () => {
          console.log(`🚀 Server is running on http://localhost:${PORT}`);
          console.log(`📡 API endpoints available at http://localhost:${PORT}/api/v1`);
          console.log(`💚 Health check: http://localhost:${PORT}/health`);
          if (isDev) {
            console.log(`⚡ Vite dev server integrated`);
            console.log(`🌐 Frontend available at http://localhost:${PORT}`);
          }
          if (!ENABLE_HTTPS) {
            console.log(`\n💡 To enable HTTPS, set ENABLE_HTTPS=true in .env and run "npm run generate-ssl"\n`);
          }
        });
      }
    })
    .catch((err) => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}


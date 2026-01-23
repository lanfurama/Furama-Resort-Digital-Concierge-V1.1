// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './_routes/index.js';
import logger from './_utils/logger.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize path: Vercel may pass /api/v1/* or /v1/* depending on rewrite config
app.use((req, res, next) => {
  // If path starts with /api/v1, strip /api prefix
  if (req.url.startsWith('/api/v1')) {
    req.url = req.url.replace('/api/v1', '/v1');
  }
  // If path starts with /api but not /api/v1, strip /api prefix
  else if (req.url.startsWith('/api/') && !req.url.startsWith('/api/v1')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// Health check - Vercel route /api/health đến đây
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Furama Resort Digital Concierge API is running' });
});

// API routes - Mount at /v1
app.use('/v1', routes);

// 404 handler for unmatched routes
app.use((req, res) => {
  logger.warn({
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path
  }, 'Route not found');
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Request error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Export handler for Vercel serverless functions
export default (req: express.Request, res: express.Response) => {
  return app(req, res);
};

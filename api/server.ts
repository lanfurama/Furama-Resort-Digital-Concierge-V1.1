import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './_routes/index.js';
import { checkAndSendCheckoutReminders } from './_services/checkoutReminderService.js';
import logger from './_utils/logger.js';
import { corsOptions } from './_config/cors.js';
import { apiLimiter } from './_config/rateLimit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS whitelist via ALLOWED_ORIGINS env (comma-separated); dev fallback allows localhost
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Furama Digital Concierge API is running' });
});

// API routes with /api/v1 prefix - rate limited
app.use('/api/v1', apiLimiter, routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Request error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📡 API endpoints available at http://localhost:${PORT}/api/v1`);

  // Start checkout reminder service (check every 5 minutes)
  logger.info('⏰ Starting checkout reminder service...');
  checkAndSendCheckoutReminders(); // Run immediately on startup
  setInterval(() => {
    checkAndSendCheckoutReminders();
  }, 5 * 60 * 1000); // Check every 5 minutes
  logger.info('✅ Checkout reminder service started (checks every 5 minutes)');
});


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './_routes/index.js';
import { checkAndSendCheckoutReminders } from './_services/checkoutReminderService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/v1`);
  
  // Start checkout reminder service (check every 5 minutes)
  console.log('⏰ Starting checkout reminder service...');
  checkAndSendCheckoutReminders(); // Run immediately on startup
  setInterval(() => {
    checkAndSendCheckoutReminders();
  }, 5 * 60 * 1000); // Check every 5 minutes
  console.log('✅ Checkout reminder service started (checks every 5 minutes)');
});


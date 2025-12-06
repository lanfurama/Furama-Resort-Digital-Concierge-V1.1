// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - Vercel route /api/health đến đây, req.url = /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Furama Resort Digital Concierge API is running' });
});

// API routes - Vercel sẽ route /api/* to this file
// Khi request đến /api/v1/users, Vercel route đến đây và req.url = /v1/users
// Nên chúng ta chỉ cần mount routes tại /v1
app.use('/v1', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Export handler for Vercel serverless functions
export default (req, res) => {
  return app(req, res);
};


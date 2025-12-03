import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './server/routes/index.js';

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

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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
  app.listen(PORT, () => {
    console.log(`🚀 API Server is running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/v1`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
  });
}


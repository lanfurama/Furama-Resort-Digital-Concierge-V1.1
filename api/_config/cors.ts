/**
 * CORS configuration for API.
 * Set ALLOWED_ORIGINS in env (comma-separated) for production, e.g.:
 * ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
 * When unset, allows common development origins.
 */
export function getCorsOrigin(): string | string[] | boolean {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
}

export const corsOptions = {
  origin: getCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

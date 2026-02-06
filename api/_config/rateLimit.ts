import rateLimit from 'express-rate-limit';

const windowMs = 15 * 60 * 1000; // 15 minutes
const max = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10); // per IP per window

export const apiLimiter = rateLimit({
  windowMs,
  max,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

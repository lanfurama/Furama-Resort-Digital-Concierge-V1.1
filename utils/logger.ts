// Frontend logger utility
// Uses console methods but with structured logging format for production monitoring
// Works in both browser (Vite) and Node.js environments

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

// Check if running in browser (Vite) or Node.js
const isBrowser = typeof window !== 'undefined';
const isVite = typeof import.meta !== 'undefined' && import.meta.env !== undefined;

// Determine environment
const isDevelopment = isVite 
  ? (import.meta.env.DEV || import.meta.env.MODE === 'development')
  : (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production');
const isProduction = isVite
  ? (import.meta.env.PROD || import.meta.env.MODE === 'production')
  : (process.env.NODE_ENV === 'production');

// Determine log level from environment
const getLogLevel = (): LogLevel => {
  let envLevel: string | undefined;
  if (isVite) {
    envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
  } else {
    envLevel = process.env.VITE_LOG_LEVEL?.toLowerCase() || process.env.LOG_LEVEL?.toLowerCase();
  }
  
  if (envLevel === 'debug' || envLevel === 'info' || envLevel === 'warn' || envLevel === 'error') {
    return envLevel;
  }
  return isDevelopment ? 'debug' : 'info';
};

const currentLogLevel = getLogLevel();
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const shouldLog = (level: LogLevel): boolean => {
  return levelPriority[level] >= levelPriority[currentLogLevel];
};

const formatLogEntry = (level: LogLevel, message: string, data?: any): LogEntry => {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };
};

const logToConsole = (entry: LogEntry) => {
  const { level, message, timestamp, data } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (isDevelopment && isBrowser) {
    // Development in browser: Pretty format with colors
    const styles: Record<LogLevel, string> = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
    };

    if (data) {
      console[level](`%c${prefix} ${message}`, styles[level], data);
    } else {
      console[level](`%c${prefix} ${message}`, styles[level]);
    }
  } else {
    // Production or Node.js: Structured format
    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }
};

// Export logger instance
export const logger = {
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      logToConsole(formatLogEntry('debug', message, data));
    }
  },

  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      logToConsole(formatLogEntry('info', message, data));
    }
  },

  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      logToConsole(formatLogEntry('warn', message, data));
    }
  },

  error: (message: string, data?: any) => {
    if (shouldLog('error')) {
      logToConsole(formatLogEntry('error', message, data));
    }
  },
};

export default logger;

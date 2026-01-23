// API Client helper for making API calls
// API and frontend run on the same port (3000), so we use relative paths
// API endpoints are prefixed with /api/v1
import logger from '../utils/logger.js';
let API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
  API_BASE_URL = process.env.VITE_API_URL;
}

// Fix Mixed Content Issue: If running on HTTPS but API URL is HTTP (common in dev),
// switch to relative path if it's the same host, or upgrade protocol.
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
  try {
    const url = new URL(API_BASE_URL);
    if (url.hostname === window.location.hostname) {
      // Same host (e.g. localhost), use relative path to respect HTTPS
      API_BASE_URL = '/api/v1';
    } else {
      // Different host, try upgrade to HTTPS
      API_BASE_URL = API_BASE_URL.replace('http:', 'https:');
    }
  } catch (e) {
    // Parse error, fallback to relative
    API_BASE_URL = '/api/v1';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Check if this is a room lookup endpoint (we'll suppress 404 logs for these)
  const isRoomLookup = endpoint.includes('/users/room/');

  // Disabled verbose logging to reduce console noise
  // if (!isRoomLookup) {
  //   console.log('API Request:', {
  //     method: options.method || 'GET',
  //     url,
  //     body: options.body ? JSON.parse(options.body as string) : undefined
  //   });
  // }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Only log response if not a 404 on room lookup
  const is404OnRoomLookup = response.status === 404 && isRoomLookup;
  // Disabled verbose logging
  // if (!is404OnRoomLookup) {
  //   console.log('API Response:', {
  //     status: response.status,
  //     statusText: response.statusText,
  //     ok: response.ok,
  //     url: response.url
  //   });
  // }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));

    // Only log actual errors (not 404 on room lookup which is expected)
    if (!is404OnRoomLookup) {
      logger.error('API Error', { endpoint, status: response.status, errorData });
    }
    // Prioritize message field, then error field, then default message
    const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMessage);
    (error as any).response = { status: response.status, body: errorData };
    throw error;
  }

  // Handle empty response (common for DELETE requests with 204 No Content)
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  // If response is empty or no content-type, return null/undefined
  if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
    // console.log('API Response: Empty body (204 No Content or no JSON)');
    return null as T;
  }

  // Try to parse JSON, but handle empty body gracefully
  const text = await response.text();
  if (!text || text.trim() === '') {
    // console.log('API Response: Empty text body');
    return null as T;
  }

  try {
    const data = JSON.parse(text);
    // console.log('API Response Data:', data);
    return data;
  } catch (parseError) {
    logger.warn('API Response: Failed to parse JSON, returning null', { parseError, endpoint });
    return null as T;
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: { method?: string }) => {
    const method = options?.method || 'POST';
    return apiRequest<T>(endpoint, {
      method,
      body: method !== 'DELETE' && data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};


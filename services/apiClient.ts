// API Client helper for making API calls
// In development: use proxy from vite.config.ts (port 5173 -> 3000)
// In production: use relative path (Vercel handles routing)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
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


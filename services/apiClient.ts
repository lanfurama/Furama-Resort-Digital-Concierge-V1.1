// API Client helper for making API calls
// API and frontend run on the same port (3000), so we use relative paths
// API endpoints are prefixed with /api/v1
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('API Request:', {
    method: options.method || 'GET',
    url,
    body: options.body ? JSON.parse(options.body as string) : undefined
  });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    console.error('API Error:', errorData);
    const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    (error as any).response = { status: response.status, body: errorData };
    throw error;
  }

  const data = await response.json();
  console.log('API Response Data:', data);
  return data;
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


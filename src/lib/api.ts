import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  (error: AxiosError<{ message?: string; statusCode?: number }>) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || error.message || 'Network error';
    
    console.error(`[API] Error ${status}:`, data, error.message);
    return Promise.reject(new Error(message));
  }
);

export { api };
export default api;

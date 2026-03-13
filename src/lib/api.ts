import axios, { AxiosError, AxiosResponse } from 'axios';

export interface ApiErrorDetail {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ApiErrorResponse {
  success: boolean;
  error?: ApiErrorDetail;
  message?: string;
}

export interface ApiError extends Error {
  response?: AxiosResponse;
  data?: ApiErrorResponse;
  status: number;
}

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
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;
    
    const errorData = data?.error || data;
    const message = errorData?.message || error.message || 'Network error';
    
    console.error(`[API] Error ${status}:`, data, error.message);
    
    const enhancedError = new Error(message) as ApiError;
    enhancedError.response = error.response;
    enhancedError.data = data;
    enhancedError.status = status ?? 0;
    
    return Promise.reject(enhancedError);
  }
);

export { api };
export default api;

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import { ApiResponse, ApiError } from '@repo/shared-types';

export interface CustomRequestConfig extends AxiosRequestConfig {
  skipToast?: boolean;
}

export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipToast?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const apiInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use(
  async (config: CustomInternalAxiosRequestConfig) => {
    if (!config.headers['x-trace-id']) {
      config.headers['x-trace-id'] =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // TODO SPEC-A3: const token = await getToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error),
);

apiInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const body = response.data;
    if (body && body.success === false) {
      const customConfig = response.config as CustomInternalAxiosRequestConfig;
      if (!customConfig?.skipToast && body.code === 'INTERNAL_ERROR') {
        toast.error(body.message || 'An internal server error occurred');
      }

      throw new ApiError(body.code, body.message, response.status, body.errors, body.traceId);
    }
    return response;
  },
  (error) => {
    const customConfig = error.config as CustomInternalAxiosRequestConfig | undefined;
    const res = error.response?.data as ApiResponse<null> | undefined;

    if (res) {
      if (!customConfig?.skipToast && res.code !== 'VALIDATION_ERROR') {
        toast.error(res.message || 'An error occurred');
      }

      throw new ApiError(
        res.code,
        res.message,
        error.response?.status ?? 500,
        res.errors,
        res.traceId,
      );
    }

    const networkMsg = error.message || 'Unable to connect to the server';
    if (!customConfig?.skipToast) {
      toast.error(networkMsg);
    }

    throw new ApiError('NETWORK_ERROR', networkMsg, 0);
  },
);

export const apiClient = {
  get: async <T>(url: string, config?: CustomRequestConfig): Promise<T> => {
    const res = await apiInstance.get<ApiResponse<T>>(url, config);
    return res.data.data as T;
  },
  post: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
    const res = await apiInstance.post<ApiResponse<T>>(url, body, config);
    return res.data.data as T;
  },
  put: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
    const res = await apiInstance.put<ApiResponse<T>>(url, body, config);
    return res.data.data as T;
  },
  patch: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
    const res = await apiInstance.patch<ApiResponse<T>>(url, body, config);
    return res.data.data as T;
  },
  delete: async <T>(url: string, config?: CustomRequestConfig): Promise<T> => {
    const res = await apiInstance.delete<ApiResponse<T>>(url, config);
    return res.data.data as T;
  },
};

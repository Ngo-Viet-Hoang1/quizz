import { useAuth } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { ApiError, ApiResponse } from '@repo/shared-types';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as React from 'react';
import { toast } from 'sonner';

export interface CustomRequestConfig extends AxiosRequestConfig {
  skipToast?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Create axios instance that have ability to bring Clerk jwt token
function createApiClientInstance(getToken?: () => Promise<string | null>) {
  const instance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      if (!config.headers['x-trace-id']) {
        config.headers['x-trace-id'] =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }

      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // Token fetch failed
        }
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<unknown>>) => {
      const body = response.data;
      if (body && body.success === false) {
        const customConfig = response.config as CustomRequestConfig;
        if (!customConfig?.skipToast && body.code === 'INTERNAL_ERROR') {
          toast.error(body.message || 'An internal server error occurred');
        }

        throw new ApiError(body.code, body.message, response.status, body.errors, body.traceId);
      }
      return response;
    },
    (error) => {
      const customConfig = error.config as CustomRequestConfig | undefined;
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

  return {
    get: async <T>(url: string, config?: CustomRequestConfig): Promise<T> => {
      const res = await instance.get<ApiResponse<T>>(url, config);
      return res.data.data as T;
    },
    post: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
      const res = await instance.post<ApiResponse<T>>(url, body, config);
      return res.data.data as T;
    },
    put: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
      const res = await instance.put<ApiResponse<T>>(url, body, config);
      return res.data.data as T;
    },
    patch: async <T>(url: string, body?: unknown, config?: CustomRequestConfig): Promise<T> => {
      const res = await instance.patch<ApiResponse<T>>(url, body, config);
      return res.data.data as T;
    },
    delete: async <T>(url: string, config?: CustomRequestConfig): Promise<T> => {
      const res = await instance.delete<ApiResponse<T>>(url, config);
      return res.data.data as T;
    },
  };
}

// Used for Public API that does not need Auth, ex: Health Check, Landing Page
export const apiClient = createApiClientInstance();

// Used for Client Component ( has 'use client', combine with Tanstack Query)
export function useApiClient() {
  const { getToken } = useAuth();
  return React.useMemo(() => createApiClientInstance(getToken), [getToken]);
}

// Used for Server Component & Route Hanlder ( Runs on Node.js SSR)
export const serverApiClient = createApiClientInstance(async () => {
  const { getToken } = await auth();
  return getToken();
});

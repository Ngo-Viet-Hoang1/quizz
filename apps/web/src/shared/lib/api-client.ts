export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  getToken?: () => Promise<string | null>,
): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      message: 'Failed to parse JSON response',
      code: 'PARSING_ERROR',
      statusCode: response.status,
    },
  }));

  if (!response.ok || !result.success) {
    const errorData = result.error || {
      message: response.statusText || 'An unexpected error occurred',
      code: 'HTTP_ERROR',
      statusCode: response.status,
    };
    throw new ApiError(errorData.message, errorData.code, errorData.statusCode);
  }

  return result.data as T;
}

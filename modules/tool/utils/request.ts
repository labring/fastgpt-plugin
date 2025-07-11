import { addLog } from '@/utils/log';

// Request configuration interface
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  baseURL?: string;
  params?: Record<string, any>;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
}

// Response interface similar to axios
export interface RequestResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

// Request error class
export class RequestError extends Error {
  public config: RequestConfig;
  public response?: Response;
  public status?: number;

  constructor(message: string, config: RequestConfig, response?: Response, status?: number) {
    super(message);
    this.name = 'RequestError';
    this.config = config;
    this.response = response;
    this.status = status;
  }
}

// Default configuration
const defaultConfig: RequestConfig = {
  method: 'GET',
  timeout: 30000,
  responseType: 'json',
  retries: 0,
  retryDelay: 1000,
  validateStatus: (status: number) => status >= 200 && status < 300,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Build URL with base URL and parameters
function buildURL(url: string, baseURL?: string, params?: Record<string, any>): string {
  let finalURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const separator = finalURL.includes('?') ? '&' : '?';
    finalURL += separator + searchParams.toString();
  }

  return finalURL;
}

// Parse response based on response type
async function parseResponse<T>(response: Response, responseType: string): Promise<T> {
  try {
    switch (responseType) {
      case 'json':
        return await response.json();
      case 'text':
        return (await response.text()) as unknown as T;
      case 'blob':
        return (await response.blob()) as unknown as T;
      case 'arrayBuffer':
        return (await response.arrayBuffer()) as unknown as T;
      default:
        return await response.json();
    }
  } catch (error) {
    throw new RequestError(
      `Failed to parse response as ${responseType}`,
      {},
      response,
      response.status
    );
  }
}

// Main request function with retry mechanism
async function executeRequest<T>(
  url: string,
  config: RequestConfig,
  attempt: number = 1
): Promise<RequestResponse<T>> {
  const finalConfig = { ...defaultConfig, ...config };
  const { timeout, retries, retryDelay, validateStatus } = finalConfig;

  // Build final URL
  const finalURL = buildURL(url, finalConfig.baseURL, finalConfig.params);

  // Prepare request options
  const requestOptions: RequestInit = {
    method: finalConfig.method,
    headers: finalConfig.headers
  };

  // Add body for non-GET requests
  if (finalConfig.method !== 'GET' && finalConfig.body !== undefined) {
    if (typeof finalConfig.body === 'object' && !(finalConfig.body instanceof FormData)) {
      requestOptions.body = JSON.stringify(finalConfig.body);
    } else {
      requestOptions.body = finalConfig.body;
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  requestOptions.signal = controller.signal;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(finalURL, requestOptions);
    clearTimeout(timeoutId);

    // Validate status
    if (!validateStatus!(response.status)) {
      const errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      throw new RequestError(errorMessage, finalConfig, response, response.status);
    }

    // Parse response data
    const data = await parseResponse<T>(response, finalConfig.responseType!);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: finalConfig
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RequestError(`Request timeout after ${timeout}ms`, finalConfig);
    }

    // Handle request errors
    if (error instanceof RequestError) {
      // Retry logic
      if (attempt <= retries!) {
        addLog.debug(`[Request] Retry ${attempt}/${retries} after ${retryDelay}ms`, {
          url: finalURL,
          error: error.message
        });
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return executeRequest<T>(url, config, attempt + 1);
      }
      throw error;
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new RequestError(errorMessage, finalConfig);
  }
}

// Request class similar to axios
export class HttpClient {
  private defaultConfig: RequestConfig;

  constructor(config: RequestConfig = {}) {
    this.defaultConfig = { ...defaultConfig, ...config };
  }

  // Generic request method
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<RequestResponse<T>> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    return executeRequest<T>(url, mergedConfig);
  }

  // GET method
  async get<T = any>(
    url: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<RequestResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  // POST method
  async post<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<RequestResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  // PUT method
  async put<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<RequestResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  // DELETE method
  async delete<T = any>(
    url: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<RequestResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // PATCH method
  async patch<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<RequestResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }

  // Create a new instance with extended configuration
  create(config: RequestConfig): HttpClient {
    return new HttpClient({ ...this.defaultConfig, ...config });
  }
}

// Default instance similar to axios
export const request = new HttpClient();

// Export convenience methods
export const GET = request.get.bind(request);
export const POST = request.post.bind(request);
export const PUT = request.put.bind(request);
export const DELETE = request.delete.bind(request);
export const PATCH = request.patch.bind(request);

// Create method for custom instances
export const createHttpClient = (config: RequestConfig): HttpClient => new HttpClient(config);

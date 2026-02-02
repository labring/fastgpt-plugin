import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import {
  createTavilyClient,
  validateApiKey,
  handleTavilyError,
  getErrorType,
  TavilyErrorType
} from '../client';

describe('Tavily Client Tests', () => {
  describe('validateApiKey', () => {
    it('should pass validation for valid API key', () => {
      expect(() => validateApiKey('tvly-1234567890abcdefghij')).not.toThrow();
    });

    it('should throw error for empty API key', () => {
      expect(() => validateApiKey('')).toThrow('Tavily API key is required');
    });

    it('should throw error for non-string API key', () => {
      expect(() => validateApiKey(null as any)).toThrow('Tavily API key is required');
      expect(() => validateApiKey(undefined as any)).toThrow('Tavily API key is required');
    });

    it('should throw error for invalid API key format (missing prefix)', () => {
      expect(() => validateApiKey('invalid-key-format')).toThrow(
        'Invalid Tavily API key format. Key should start with "tvly-"'
      );
    });

    it('should throw error for API key that is too short', () => {
      expect(() => validateApiKey('tvly-short')).toThrow(
        'Invalid Tavily API key format. Key is too short'
      );
    });
  });

  describe('createTavilyClient', () => {
    it('should create axios client with correct configuration', () => {
      const apiKey = 'tvly-test-api-key-1234567890';
      const client = createTavilyClient(apiKey);

      expect(client.defaults.baseURL).toBe('https://api.tavily.com');
      expect(client.defaults.headers['Authorization']).toBe(`Bearer ${apiKey}`);
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
      expect(client.defaults.timeout).toBe(60000);
    });
  });

  describe('handleTavilyError', () => {
    it('should handle 401 authentication error', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Invalid API key' }
        },
        message: 'Request failed'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Authentication failed');
      expect(result).toContain('Invalid API key');
    });

    it('should handle 429 rate limit error', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        },
        message: 'Too many requests'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Rate limit exceeded');
      expect(result).toContain('Please wait before making more requests');
    });

    it('should handle 400 bad request error', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Invalid query parameter' }
        },
        message: 'Bad request'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Invalid request');
      expect(result).toContain('Invalid query parameter');
    });

    it('should handle 500 server error', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        },
        message: 'Server error'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Tavily server error');
      expect(result).toContain('Please try again later');
    });

    it('should handle timeout error', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Request timeout');
      expect(result).toContain('check your network connection');
    });

    it('should handle network connection error', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result = handleTavilyError(error);
      expect(result).toContain('Network error');
      expect(result).toContain('Cannot reach Tavily API');
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleTavilyError(error);
      expect(result).toBe('Something went wrong');
    });

    it('should handle string error', () => {
      const error = 'String error message';
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleTavilyError(error);
      expect(result).toBe('String error message');
    });

    it('should handle unknown error type', () => {
      const error = { unknown: 'object' };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result = handleTavilyError(error);
      expect(result).toBe('Unknown error occurred while calling Tavily API');
    });
  });

  describe('getErrorType', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should return AUTH_ERROR for 401', () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 }
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.AUTH_ERROR);
    });

    it('should return AUTH_ERROR for 403', () => {
      const error = {
        isAxiosError: true,
        response: { status: 403 }
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.AUTH_ERROR);
    });

    it('should return RATE_LIMIT for 429', () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 }
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.RATE_LIMIT);
    });

    it('should return INVALID_REQUEST for 400', () => {
      const error = {
        isAxiosError: true,
        response: { status: 400 }
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.INVALID_REQUEST);
    });

    it('should return SERVER_ERROR for 500+', () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 }
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.SERVER_ERROR);
    });

    it('should return TIMEOUT for ECONNABORTED', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.TIMEOUT);
    });

    it('should return NETWORK_ERROR for ECONNREFUSED', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNREFUSED'
      } as AxiosError;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getErrorType(error)).toBe(TavilyErrorType.NETWORK_ERROR);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const error = new Error('Unknown error');

      expect(getErrorType(error)).toBe(TavilyErrorType.UNKNOWN);
    });
  });
});

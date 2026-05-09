import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST, type RequestResponse } from '@tool/utils/request';
import { tool, type InputProps } from '../src';

vi.mock('@tool/utils/request', () => ({
  POST: vi.fn()
}));

const mockedPOST = vi.mocked(POST);
const fetchMock = vi.fn();

const DEFAULT_API_BASE_URL = 'https://somark.tech/api/v1';
const SELF_HOST_BASE_URL = 'https://somark.internal/api/v1';

function mockResponse(data: unknown): RequestResponse<unknown> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    config: {}
  };
}

function createInput(overrides: Partial<InputProps> = {}): InputProps {
  return {
    deploymentType: 'api',
    apiKey: 'sk-test-api-key',
    baseUrl: DEFAULT_API_BASE_URL,
    file: ['https://example.test/sample.pdf'],
    outputFormats: ['json', 'markdown'],
    imageFormat: 'url',
    formulaFormat: 'latex',
    tableFormat: 'html',
    chemicalStructureFormat: 'image',
    enableTextCrossPage: false,
    enableTableCrossPage: false,
    enableTitleLevelRecognition: false,
    enableInlineImage: true,
    enableTableImage: true,
    enableImageUnderstanding: true,
    keepHeaderFooter: false,
    ...overrides
  };
}

function mockFetchFile(body = 'file-content', init: ResponseInit = {}) {
  fetchMock.mockResolvedValueOnce(
    new Response(body, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/pdf' },
      ...init
    })
  );
}

function mockApiResponse(outputs: { markdown?: string; json?: Record<string, any> } = {}) {
  mockedPOST.mockResolvedValueOnce(
    mockResponse({
      code: 0,
      message: 'ok',
      data: { result: { outputs } }
    })
  );
}

function mockSelfHostResponse(outputs: { markdown?: string; json?: Record<string, any> } = {}) {
  mockedPOST.mockResolvedValueOnce(
    mockResponse({
      code: 0,
      message: 'ok',
      outputs
    })
  );
}

function getCallForm(): FormData {
  return mockedPOST.mock.calls[0][1] as FormData;
}

function getCallEntries(): Record<string, unknown[]> {
  const entries: Record<string, unknown[]> = {};
  for (const [key, value] of getCallForm().entries()) {
    entries[key] ??= [];
    entries[key].push(value);
  }
  return entries;
}

describe('SoMarkDocumentParser tool', () => {
  beforeEach(() => {
    mockedPOST.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('SoMark API mode', () => {
    test('posts to /parse/sync with api_key and parses data.data.result.outputs', async () => {
      mockFetchFile();
      mockApiResponse({ markdown: '# Parsed', json: { pages: 1 } });

      const result = await tool(
        createInput({
          enableTextCrossPage: true,
          enableTableCrossPage: true,
          enableTitleLevelRecognition: true,
          enableInlineImage: false,
          enableTableImage: false,
          enableImageUnderstanding: false,
          keepHeaderFooter: true
        })
      );

      expect(result).toEqual({ markdown: '# Parsed', json: { pages: 1 } });
      expect(mockedPOST).toHaveBeenCalledWith('/parse/sync', expect.any(FormData), {
        baseURL: DEFAULT_API_BASE_URL,
        headers: {},
        timeout: 120_000,
        retries: 1
      });

      const entries = getCallEntries();
      expect(fetchMock).toHaveBeenCalledWith('https://example.test/sample.pdf');
      expect((entries.file[0] as File).name).toBe('sample.pdf');
      expect(entries.api_key).toEqual(['sk-test-api-key']);
      expect(entries.output_formats).toEqual(['json', 'markdown']);
      expect(JSON.parse(entries.element_formats[0] as string)).toEqual({
        image: 'url',
        formula: 'latex',
        table: 'html',
        cs: 'image'
      });
      expect(JSON.parse(entries.feature_configs[0] as string)).toEqual({
        enable_text_cross_page: true,
        enable_table_cross_page: true,
        enable_title_level_recognition: true,
        enable_inline_image: false,
        enable_table_image: false,
        enable_image_understanding: false,
        keep_header_footer: true
      });
    });

    test('rejects baseUrl other than the default', async () => {
      await expect(tool(createInput({ baseUrl: 'https://somark.tech/api/v2' }))).rejects.toThrow(
        /Base URL or API Key is invalid/
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('rejects empty apiKey', async () => {
      await expect(tool(createInput({ apiKey: '' }))).rejects.toThrow(
        /Base URL or API Key is invalid/
      );
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('rejects apiKey not starting with sk-', async () => {
      await expect(tool(createInput({ apiKey: 'test-api-key' }))).rejects.toThrow(
        /Base URL or API Key is invalid/
      );
      expect(mockedPOST).not.toHaveBeenCalled();
    });
  });

  describe('SoMark Self-host mode', () => {
    function selfHostInput(overrides: Partial<InputProps> = {}): InputProps {
      return createInput({
        deploymentType: 'private',
        apiKey: '',
        baseUrl: SELF_HOST_BASE_URL,
        ...overrides
      });
    }

    test('posts to /extract without api_key and parses data.outputs', async () => {
      mockFetchFile();
      mockSelfHostResponse({ markdown: '# Private', json: { private: true } });

      const result = await tool(selfHostInput());

      expect(result).toEqual({ markdown: '# Private', json: { private: true } });
      expect(mockedPOST).toHaveBeenCalledWith('/extract', expect.any(FormData), {
        baseURL: SELF_HOST_BASE_URL,
        headers: {},
        timeout: 120_000,
        retries: 1
      });

      const entries = getCallEntries();
      expect(entries.api_key).toBeUndefined();
    });

    test('trims trailing slashes from baseUrl', async () => {
      mockFetchFile();
      mockSelfHostResponse({ markdown: 'ok', json: {} });

      await tool(selfHostInput({ baseUrl: `${SELF_HOST_BASE_URL}///` }));

      expect(mockedPOST).toHaveBeenCalledWith(
        '/extract',
        expect.any(FormData),
        expect.objectContaining({ baseURL: SELF_HOST_BASE_URL })
      );
    });

    test('rejects empty baseUrl', async () => {
      await expect(tool(selfHostInput({ baseUrl: '' }))).rejects.toThrow('Base URL is required');
      expect(mockedPOST).not.toHaveBeenCalled();
    });
  });

  describe('file handling', () => {
    test('uses filename query parameter for downloaded files', async () => {
      mockFetchFile();
      mockApiResponse();

      await tool(
        createInput({
          file: [
            'http://localhost:3001/api/system/file/download/download-token?filename=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E5%BA%93.pdf'
          ]
        })
      );

      expect((getCallEntries().file[0] as File).name).toBe('个人知识库.pdf');
    });

    test('falls back to URL path basename when no filename query', async () => {
      mockFetchFile();
      mockApiResponse();

      await tool(createInput({ file: ['https://example.test/path-only.docx'] }));

      expect((getCallEntries().file[0] as File).name).toBe('path-only.docx');
    });

    test('falls back to "document" when URL has no resolvable filename', async () => {
      mockFetchFile();
      mockApiResponse();

      await tool(createInput({ file: ['not-a-url'] }));

      expect((getCallEntries().file[0] as File).name).toBe('document');
    });

    test('falls back to "document" when URL path is empty', async () => {
      mockFetchFile();
      mockApiResponse();

      await tool(createInput({ file: ['https://example.test/'] }));

      expect((getCallEntries().file[0] as File).name).toBe('document');
    });

    test('falls back to "document" when filename query resolves to whitespace', async () => {
      mockFetchFile();
      mockApiResponse();

      await tool(createInput({ file: ['https://example.test/sample.pdf?filename=%20%20%20'] }));

      expect((getCallEntries().file[0] as File).name).toBe('document');
    });

    test('throws when file URL is empty', async () => {
      await expect(tool(createInput({ file: [''] }))).rejects.toThrow('File path is required');
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when source file fetch fails', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('missing', { status: 404, statusText: 'Not Found' })
      );

      await expect(tool(createInput())).rejects.toThrow('Failed to fetch file: 404 Not Found');
      expect(mockedPOST).not.toHaveBeenCalled();
    });
  });

  describe('output mapping', () => {
    test('omits markdown when not requested', async () => {
      mockFetchFile();
      mockApiResponse({ markdown: 'ignored', json: { kept: true } });

      await expect(tool(createInput({ outputFormats: ['json'] }))).resolves.toEqual({
        markdown: '',
        json: { kept: true }
      });
    });

    test('omits json when not requested', async () => {
      mockFetchFile();
      mockApiResponse({ markdown: 'kept', json: { ignored: true } });

      await expect(tool(createInput({ outputFormats: ['markdown'] }))).resolves.toEqual({
        markdown: 'kept',
        json: {}
      });
    });

    test('returns empty defaults when outputs are partially populated', async () => {
      mockFetchFile();
      mockApiResponse({ markdown: 'only-markdown' });

      await expect(tool(createInput())).resolves.toEqual({
        markdown: 'only-markdown',
        json: {}
      });
    });
  });

  describe('error handling', () => {
    test('throws SoMark API string error detail', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(
        mockResponse({
          code: 400,
          message: 'request failed',
          data: { error: 'invalid file' }
        })
      );

      await expect(tool(createInput())).rejects.toThrow('SoMark API error: invalid file');
    });

    test('falls back to message when error detail is not a string', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(
        mockResponse({
          code: 401,
          message: 'unauthorized',
          data: { error: { reason: 'bad key' } }
        })
      );

      await expect(tool(createInput())).rejects.toThrow('SoMark API error: unauthorized');
    });

    test('falls back to "unknown error" when no detail is present', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(mockResponse({ code: 500, message: '', data: null }));

      await expect(tool(createInput())).rejects.toThrow('SoMark API error: unknown error');
    });

    test('throws when response data is null (code missing)', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(mockResponse(null));

      await expect(tool(createInput())).rejects.toThrow('SoMark API error: unknown error');
    });

    test('throws when API mode response has no outputs', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: { result: {} } })
      );

      await expect(tool(createInput())).rejects.toThrow('SoMark response has no outputs');
    });

    test('throws when Self-host mode response has no outputs', async () => {
      mockFetchFile();
      mockedPOST.mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok' }));

      await expect(
        tool(
          createInput({
            deploymentType: 'private',
            apiKey: '',
            baseUrl: SELF_HOST_BASE_URL
          })
        )
      ).rejects.toThrow('SoMark response has no outputs');
    });
  });
});

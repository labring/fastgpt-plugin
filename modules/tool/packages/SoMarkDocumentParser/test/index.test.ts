import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST, type RequestResponse } from '@tool/utils/request';
import { tool, type InputProps } from '../src';

// ---------- Mocks ----------

vi.mock('@tool/utils/request', () => ({
  POST: vi.fn()
}));

vi.mock('@tool/utils/delay', () => ({
  delay: vi.fn(() => Promise.resolve(''))
}));

const mockedPOST = vi.mocked(POST);
const fetchMock = vi.fn();

// ---------- Constants ----------

const DEFAULT_BASE_URL = 'https://somark.tech/api/v1';
const SELF_HOST_BASE_URL = 'https://somark.internal/api/v1';
const SAMPLE_FILE_URL = 'https://example.test/sample.pdf';

// SoMark 并发限流错误码,与 src/index.ts 中的 QPS_LIMIT_CODE 保持一致
const QPS_LIMIT_CODE = 1124;

// ---------- Helpers ----------

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
    apiKey: 'sk-test-api-key',
    baseUrl: DEFAULT_BASE_URL,
    file: [SAMPLE_FILE_URL],
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

function mockFetchOk(body = 'file-content') {
  fetchMock.mockResolvedValueOnce(
    new Response(body, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/pdf' }
    })
  );
}

function mockFetchNotFound() {
  fetchMock.mockResolvedValueOnce(
    new Response('missing', { status: 404, statusText: 'Not Found' })
  );
}

function mockSubmitSuccess(taskId = 'task-123') {
  mockedPOST.mockResolvedValueOnce(
    mockResponse({ code: 0, message: 'ok', data: { task_id: taskId } })
  );
}

function mockSubmitError(code: number, message: string) {
  mockedPOST.mockResolvedValueOnce(mockResponse({ code, message, data: null }));
}

function mockCheckSuccess(outputs: { markdown?: string; json?: Record<string, any> } = {}) {
  mockedPOST.mockResolvedValueOnce(
    mockResponse({
      code: 0,
      message: 'ok',
      data: { status: 'SUCCESS', result: { outputs } }
    })
  );
}

function mockCheckStatus(status: 'QUEUING' | 'PROCESSING' | 'FAILED', message = 'ok') {
  mockedPOST.mockResolvedValueOnce(mockResponse({ code: 0, message, data: { status } }));
}

/** Convenience: submit success → check success. */
function mockHappyFile(outputs: { markdown?: string; json?: Record<string, any> } = {}) {
  mockFetchOk();
  mockSubmitSuccess();
  mockCheckSuccess(outputs);
}

function nthSubmitForm(n: number): FormData {
  // POST calls come in submit/check pairs per file. n is 1-based file index.
  return mockedPOST.mock.calls[(n - 1) * 2][1] as FormData;
}

function formEntries(form: FormData): Record<string, unknown[]> {
  const entries: Record<string, unknown[]> = {};
  for (const [key, value] of form.entries()) {
    entries[key] ??= [];
    entries[key].push(value);
  }
  return entries;
}

// ---------- Tests ----------

describe('SoMarkDocumentParser tool', () => {
  beforeEach(() => {
    mockedPOST.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('request construction', () => {
    test('submits to /parse/async, polls /parse/async_check, returns mapped results', async () => {
      mockFetchOk();
      mockSubmitSuccess('task-abc');
      mockCheckSuccess({ markdown: '# Parsed', json: { pages: 1 } });

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

      expect(result).toEqual({ results: [{ markdown: '# Parsed', json: { pages: 1 } }] });

      // Submit call
      expect(mockedPOST).toHaveBeenNthCalledWith(1, '/parse/async', expect.any(FormData), {
        baseURL: DEFAULT_BASE_URL,
        headers: {},
        timeout: 60_000,
        retries: 1
      });
      // Check call
      expect(mockedPOST).toHaveBeenNthCalledWith(2, '/parse/async_check', expect.any(FormData), {
        baseURL: DEFAULT_BASE_URL,
        headers: {},
        timeout: 30_000,
        retries: 1
      });

      // Submit form fields
      const submit = formEntries(nthSubmitForm(1));
      expect(fetchMock).toHaveBeenCalledWith(SAMPLE_FILE_URL);
      expect((submit.file[0] as File).name).toBe('sample.pdf');
      expect(submit.api_key).toEqual(['sk-test-api-key']);
      expect(submit.output_formats).toEqual(['json', 'markdown']);
      expect(JSON.parse(submit.element_formats[0] as string)).toEqual({
        image: 'url',
        formula: 'latex',
        table: 'html',
        cs: 'image'
      });
      expect(JSON.parse(submit.feature_config[0] as string)).toEqual({
        enable_text_cross_page: true,
        enable_table_cross_page: true,
        enable_title_level_recognition: true,
        enable_inline_image: false,
        enable_table_image: false,
        enable_image_understanding: false,
        keep_header_footer: true
      });

      // Check form carries task_id + api_key
      const check = mockedPOST.mock.calls[1][1] as FormData;
      expect(check.get('task_id')).toBe('task-abc');
      expect(check.get('api_key')).toBe('sk-test-api-key');
    });

    test('accepts a custom baseUrl (self-host deployment)', async () => {
      mockHappyFile({ markdown: 'ok', json: {} });

      await tool(createInput({ baseUrl: SELF_HOST_BASE_URL }));

      expect(mockedPOST).toHaveBeenNthCalledWith(
        1,
        '/parse/async',
        expect.any(FormData),
        expect.objectContaining({ baseURL: SELF_HOST_BASE_URL })
      );
      expect(mockedPOST).toHaveBeenNthCalledWith(
        2,
        '/parse/async_check',
        expect.any(FormData),
        expect.objectContaining({ baseURL: SELF_HOST_BASE_URL })
      );
    });

    test('trims trailing slashes from baseUrl', async () => {
      mockHappyFile({ markdown: 'ok', json: {} });

      await tool(createInput({ baseUrl: `${DEFAULT_BASE_URL}///` }));

      expect(mockedPOST).toHaveBeenNthCalledWith(
        1,
        '/parse/async',
        expect.any(FormData),
        expect.objectContaining({ baseURL: DEFAULT_BASE_URL })
      );
    });

    test('always appends api_key form field, even when empty (self-host)', async () => {
      mockHappyFile({ markdown: 'ok', json: {} });

      await tool(createInput({ baseUrl: SELF_HOST_BASE_URL, apiKey: '' }));

      expect(formEntries(nthSubmitForm(1)).api_key).toEqual(['']);
    });
  });

  describe('validation (global config — throws immediately)', () => {
    test('throws when baseUrl is empty', async () => {
      await expect(tool(createInput({ baseUrl: '' }))).rejects.toThrow('Base URL is required');
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when baseUrl is whitespace only', async () => {
      await expect(tool(createInput({ baseUrl: '   ' }))).rejects.toThrow('Base URL is required');
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when baseUrl lacks http(s) protocol', async () => {
      await expect(tool(createInput({ baseUrl: 'somark.tech/api/v1' }))).rejects.toThrow(
        'Base URL must start with http:// or https://'
      );
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when apiKey is empty against the default SoMark API baseUrl', async () => {
      await expect(tool(createInput({ apiKey: '' }))).rejects.toThrow(/API Key is invalid/);
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when apiKey does not start with sk- against the default SoMark API baseUrl', async () => {
      await expect(tool(createInput({ apiKey: 'plain-token' }))).rejects.toThrow(
        /API Key is invalid/
      );
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('skips apiKey validation for self-host baseUrl (empty apiKey allowed)', async () => {
      mockHappyFile({ markdown: 'ok', json: {} });

      await expect(
        tool(createInput({ baseUrl: SELF_HOST_BASE_URL, apiKey: '' }))
      ).resolves.toBeDefined();
      expect(mockedPOST).toHaveBeenCalled();
    });

    test('skips apiKey validation for self-host baseUrl (non-sk- token allowed)', async () => {
      mockHappyFile({ markdown: 'ok', json: {} });

      await expect(
        tool(createInput({ baseUrl: SELF_HOST_BASE_URL, apiKey: 'arbitrary-token' }))
      ).resolves.toBeDefined();
      expect(mockedPOST).toHaveBeenCalled();
    });
  });

  describe('file name resolution', () => {
    test('prefers the filename query parameter', async () => {
      mockHappyFile();

      await tool(
        createInput({
          file: [
            'http://localhost:3001/api/system/file/download/download-token?filename=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E5%BA%93.pdf'
          ]
        })
      );

      expect((formEntries(nthSubmitForm(1)).file[0] as File).name).toBe('个人知识库.pdf');
    });

    test('falls back to the URL path basename when no filename query', async () => {
      mockHappyFile();

      await tool(createInput({ file: ['https://example.test/path-only.docx'] }));

      expect((formEntries(nthSubmitForm(1)).file[0] as File).name).toBe('path-only.docx');
    });

    test('falls back to "document" when URL parsing fails', async () => {
      mockHappyFile();

      await tool(createInput({ file: ['not-a-url'] }));

      expect((formEntries(nthSubmitForm(1)).file[0] as File).name).toBe('document');
    });

    test('falls back to "document" when URL path is empty', async () => {
      mockHappyFile();

      await tool(createInput({ file: ['https://example.test/'] }));

      expect((formEntries(nthSubmitForm(1)).file[0] as File).name).toBe('document');
    });

    test('falls back to "document" when filename query is whitespace only', async () => {
      mockHappyFile();

      await tool(createInput({ file: ['https://example.test/sample.pdf?filename=%20%20%20'] }));

      expect((formEntries(nthSubmitForm(1)).file[0] as File).name).toBe('document');
    });
  });

  describe('per-file error: file fetch / empty URL', () => {
    test('throws when the only file URL is empty (aggregated error)', async () => {
      await expect(tool(createInput({ file: [''] }))).rejects.toThrow(/File path is required/);
      expect(mockedPOST).not.toHaveBeenCalled();
    });

    test('throws when source file download fails (aggregated error)', async () => {
      mockFetchNotFound();

      await expect(tool(createInput())).rejects.toThrow(/Failed to download file/);
      expect(mockedPOST).not.toHaveBeenCalled();
    });
  });

  describe('output mapping (single file)', () => {
    test('omits markdown when not requested', async () => {
      mockHappyFile({ markdown: 'ignored', json: { kept: true } });

      await expect(tool(createInput({ outputFormats: ['json'] }))).resolves.toEqual({
        results: [{ markdown: '', json: { kept: true } }]
      });
    });

    test('omits json when not requested', async () => {
      mockHappyFile({ markdown: 'kept', json: { ignored: true } });

      await expect(tool(createInput({ outputFormats: ['markdown'] }))).resolves.toEqual({
        results: [{ markdown: 'kept', json: {} }]
      });
    });

    test('fills empty defaults when SoMark outputs are partially populated', async () => {
      mockHappyFile({ markdown: 'only-markdown' });

      await expect(tool(createInput())).resolves.toEqual({
        results: [{ markdown: 'only-markdown', json: {} }]
      });
    });
  });

  describe('submit phase error handling', () => {
    test('throws SoMark API error using response message', async () => {
      mockFetchOk();
      mockSubmitError(400, 'request failed');

      await expect(tool(createInput())).rejects.toThrow(/SoMark API error: request failed/);
    });

    test('falls back to "unknown error" when message is empty', async () => {
      mockFetchOk();
      mockSubmitError(500, '');

      await expect(tool(createInput())).rejects.toThrow(/SoMark API error: unknown error/);
    });

    test('throws when response data is null', async () => {
      mockFetchOk();
      mockedPOST.mockResolvedValueOnce(mockResponse(null));

      await expect(tool(createInput())).rejects.toThrow(/SoMark API error: unknown error/);
    });

    test('wraps network failure with a connection error (HTTPS)', async () => {
      mockFetchOk();
      mockedPOST.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(tool(createInput())).rejects.toThrow(
        /Failed to connect to the SoMark service .* over HTTPS/
      );
    });

    test('wraps network failure with a connection error (HTTP)', async () => {
      mockFetchOk();
      mockedPOST.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        tool(createInput({ baseUrl: 'http://somark.internal/api/v1', apiKey: '' }))
      ).rejects.toThrow(/over HTTP\b/);
    });

    test(`retries on QPS limit code (${QPS_LIMIT_CODE}) and recovers`, async () => {
      mockFetchOk();
      // 1st submit: QPS limited
      mockSubmitError(QPS_LIMIT_CODE, 'qps limit');
      // 2nd submit: success
      mockSubmitSuccess('task-retry');
      // Check: success
      mockCheckSuccess({ markdown: 'after-retry', json: {} });

      const result = await tool(createInput());

      expect(result.results[0].markdown).toBe('after-retry');
      expect(mockedPOST).toHaveBeenCalledTimes(3);
      expect(mockedPOST.mock.calls[0][0]).toBe('/parse/async');
      expect(mockedPOST.mock.calls[1][0]).toBe('/parse/async');
      expect(mockedPOST.mock.calls[2][0]).toBe('/parse/async_check');
    });

    test('throws "currently busy" when QPS retries exhaust the submit budget', async () => {
      mockFetchOk();
      mockedPOST.mockResolvedValue(
        mockResponse({ code: QPS_LIMIT_CODE, message: 'qps limit', data: null })
      );

      // Force the deadline check to fail immediately after the first attempt.
      // submitTask calls Date.now once (to compute deadline); subsequent backoff
      // checks must read past that deadline to trigger the "busy" branch.
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValueOnce(0);
      nowSpy.mockReturnValue(Number.MAX_SAFE_INTEGER);

      try {
        await expect(tool(createInput())).rejects.toThrow(
          /SoMark service is currently busy \(QPS limit\)/
        );
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('poll phase error handling', () => {
    test('throws when check returns non-zero code', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockedPOST.mockResolvedValueOnce(
        mockResponse({ code: 500, message: 'lookup failed', data: null })
      );

      await expect(tool(createInput())).rejects.toThrow(/SoMark API error: lookup failed/);
    });

    test('throws when task status is FAILED', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockCheckStatus('FAILED', 'parse error');

      await expect(tool(createInput())).rejects.toThrow(/SoMark task failed: parse error/);
    });

    test('falls back to "task failed" when FAILED response has no message', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockCheckStatus('FAILED', '');

      await expect(tool(createInput())).rejects.toThrow(/SoMark task failed: task failed/);
    });

    test('polls again while status is QUEUING/PROCESSING, then returns on SUCCESS', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockCheckStatus('QUEUING');
      mockCheckStatus('PROCESSING');
      mockCheckSuccess({ markdown: 'eventually', json: {} });

      const result = await tool(createInput());

      expect(result.results[0].markdown).toBe('eventually');
      // 1 submit + 3 checks = 4 POSTs
      expect(mockedPOST).toHaveBeenCalledTimes(4);
    });

    test('throws when SUCCESS response has no outputs', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockedPOST.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: { status: 'SUCCESS', result: {} } })
      );

      await expect(tool(createInput())).rejects.toThrow(/SoMark response has no outputs/);
    });

    test('wraps network failure during polling with a connection error', async () => {
      mockFetchOk();
      mockSubmitSuccess();
      mockedPOST.mockRejectedValueOnce(new Error('ECONNRESET'));

      await expect(tool(createInput())).rejects.toThrow(/Failed to connect to the SoMark service/);
    });

    test('throws timeout error when polling exceeds the poll budget', async () => {
      mockFetchOk();
      mockSubmitSuccess('task-timeout');

      // submitTask reads Date.now once (deadline); pollTask reads it twice
      // (deadline, then while-check). Make the while-check land past deadline.
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValueOnce(0); // submitTask deadline
      nowSpy.mockReturnValueOnce(0); // pollTask deadline
      nowSpy.mockReturnValue(Number.MAX_SAFE_INTEGER); // while-check exits immediately

      try {
        await expect(tool(createInput())).rejects.toThrow(
          /SoMark task task-timeout timed out after \d+s/
        );
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('multi-file handling', () => {
    test('processes files strictly sequentially in input order', async () => {
      mockHappyFile({ markdown: 'A', json: { idx: 0 } });
      mockHappyFile({ markdown: 'B', json: { idx: 1 } });
      mockHappyFile({ markdown: 'C', json: { idx: 2 } });

      const result = await tool(
        createInput({
          file: [
            'https://example.test/a.pdf',
            'https://example.test/b.pdf',
            'https://example.test/c.pdf'
          ]
        })
      );

      expect(result.results).toEqual([
        { markdown: 'A', json: { idx: 0 } },
        { markdown: 'B', json: { idx: 1 } },
        { markdown: 'C', json: { idx: 2 } }
      ]);

      // Sequencing: fetch → submit → check, repeated per file
      expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
        'https://example.test/a.pdf',
        'https://example.test/b.pdf',
        'https://example.test/c.pdf'
      ]);
      expect(mockedPOST).toHaveBeenCalledTimes(6);

      // First file gets task-123 (default), submit/check are calls 0 and 1
      expect(mockedPOST.mock.calls[0][0]).toBe('/parse/async');
      expect(mockedPOST.mock.calls[1][0]).toBe('/parse/async_check');
    });

    test('throws aggregated error when every file failed', async () => {
      mockFetchNotFound();
      mockFetchNotFound();

      await expect(
        tool(
          createInput({
            file: ['https://example.test/a.pdf', 'https://example.test/b.pdf']
          })
        )
      ).rejects.toThrow(/2 of 2 file\(s\) failed to parse/);
    });

    test('runs all files then throws aggregated error when any file failed', async () => {
      // File 1: success
      mockHappyFile({ markdown: 'A', json: {} });
      // File 2: fetch fails
      mockFetchNotFound();
      // File 3: success — must still run despite earlier failure (no fail-fast)
      mockHappyFile({ markdown: 'C', json: {} });

      await expect(
        tool(
          createInput({
            file: [
              'https://example.test/a.pdf',
              'https://example.test/missing.pdf',
              'https://example.test/c.pdf'
            ]
          })
        )
      ).rejects.toThrow(/1 of 3 file\(s\) failed to parse: \[1\] .*Failed to download file/);

      // Verify all 3 files were attempted (no fail-fast)
      expect(fetchMock).toHaveBeenCalledTimes(3);
      // 2 successful files × 2 POSTs each = 4
      expect(mockedPOST).toHaveBeenCalledTimes(4);
    });

    test('aggregated error includes all failed indexes with their reasons', async () => {
      // File 0: SoMark API error
      mockFetchOk();
      mockSubmitError(400, 'first error');
      // File 1: success (sandwiched between two failures)
      mockHappyFile({ markdown: 'B', json: {} });
      // File 2: FAILED status
      mockFetchOk();
      mockSubmitSuccess('task-2');
      mockCheckStatus('FAILED', 'third error');

      await expect(
        tool(
          createInput({
            file: [
              'https://example.test/a.pdf',
              'https://example.test/b.pdf',
              'https://example.test/c.pdf'
            ]
          })
        )
      ).rejects.toThrow(
        /2 of 3 file\(s\) failed to parse: \[0\] SoMark API error: first error; \[2\] SoMark task failed: third error/
      );
    });
  });
});

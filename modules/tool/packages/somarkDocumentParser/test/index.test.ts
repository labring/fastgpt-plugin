import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST, type RequestResponse } from '@tool/utils/request';
import { tool, type InputProps } from '../src';

vi.mock('@tool/utils/request', () => ({
  POST: vi.fn()
}));

const mockedPOST = vi.mocked(POST);
const fetchMock = vi.fn();

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
    apiKey: 'test-api-key',
    baseUrl: 'https://example.test/api/v1',
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
      headers: {
        'Content-Type': 'application/pdf'
      },
      ...init
    })
  );
}

function formEntries(form: FormData): Record<string, unknown[]> {
  const entries: Record<string, unknown[]> = {};

  for (const [key, value] of form.entries()) {
    entries[key] ??= [];
    entries[key].push(value);
  }

  return entries;
}

describe('somarkDocumentParser tool', () => {
  beforeEach(() => {
    mockedPOST.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sends the file url and parser options to SoMark', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 0,
        message: 'ok',
        data: {
          result: {
            outputs: {
              markdown: '# Parsed',
              json: { pages: 1 }
            }
          }
        }
      })
    );

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

    expect(result).toEqual({
      markdown: '# Parsed',
      json: { pages: 1 }
    });
    expect(mockedPOST).toHaveBeenCalledTimes(1);
    expect(mockedPOST).toHaveBeenCalledWith('/parse/sync', expect.any(FormData), {
      baseURL: 'https://example.test/api/v1',
      headers: {},
      timeout: 120_000,
      retries: 1
    });

    const form = mockedPOST.mock.calls[0][1] as FormData;
    const entries = formEntries(form);
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/sample.pdf');
    expect(entries.file).toHaveLength(1);
    expect(entries.file[0]).toBeInstanceOf(Blob);
    expect((entries.file[0] as File).name).toBe('sample.pdf');
    expect(entries.api_key).toEqual(['test-api-key']);
    expect(entries.output_formats).toEqual(['json', 'markdown']);
    expect(JSON.parse(entries.element_formats[0] as string)).toEqual({
      image: 'url',
      formula: 'latex',
      table: 'html',
      chemical_structure: 'image'
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

  test('uses a file url string and omits unrequested markdown output', async () => {
    mockFetchFile('docx-content');
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 0,
        message: 'ok',
        data: {
          result: {
            outputs: {
              markdown: '# Ignored',
              json: { blocks: [] }
            }
          }
        }
      })
    );

    const result = await tool(
      createInput({
        file: ['https://example.test/path-only.docx'],
        outputFormats: ['json'],
        imageFormat: 'base64',
        formulaFormat: 'mathml',
        tableFormat: 'markdown'
      })
    );

    const form = mockedPOST.mock.calls[0][1] as FormData;
    const entries = formEntries(form);
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/path-only.docx');
    expect((entries.file[0] as File).name).toBe('path-only.docx');
    expect(entries.output_formats).toEqual(['json']);
    expect(JSON.parse(entries.element_formats[0] as string)).toEqual({
      image: 'base64',
      formula: 'mathml',
      table: 'markdown',
      chemical_structure: 'image'
    });
    expect(result).toEqual({
      markdown: '',
      json: { blocks: [] }
    });
  });

  test('omits unrequested json output', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 0,
        message: 'ok',
        data: {
          result: {
            outputs: {
              markdown: 'parsed markdown',
              json: { ignored: true }
            }
          }
        }
      })
    );

    await expect(
      tool(
        createInput({
          outputFormats: ['markdown'],
          imageFormat: 'none',
          formulaFormat: 'ascii',
          tableFormat: 'image'
        })
      )
    ).resolves.toEqual({
      markdown: 'parsed markdown',
      json: {}
    });
  });

  test('returns declared empty outputs when the API omits outputs', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        message: 'ok',
        data: {
          result: {}
        }
      })
    );

    await expect(tool(createInput())).resolves.toEqual({
      markdown: '',
      json: {}
    });
  });

  test('throws when the input file has no resolvable url', async () => {
    await expect(tool(createInput({ file: [''] }))).rejects.toThrow(
      'Cannot resolve file url from input'
    );
    expect(mockedPOST).not.toHaveBeenCalled();
  });

  test('uses a fallback filename when the file url has no path name', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 0,
        message: 'ok',
        data: {
          result: {}
        }
      })
    );

    await tool(createInput({ file: ['not-a-url'] }));

    const form = mockedPOST.mock.calls[0][1] as FormData;
    const entries = formEntries(form);
    expect((entries.file[0] as File).name).toBe('document');
  });

  test('throws when the source file cannot be fetched', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('missing', {
        status: 404,
        statusText: 'Not Found'
      })
    );

    await expect(tool(createInput())).rejects.toThrow('Failed to fetch file: 404 Not Found');
    expect(mockedPOST).not.toHaveBeenCalled();
  });

  test('throws SoMark API string errors', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 400,
        message: 'request failed',
        data: {
          error: 'invalid file'
        }
      })
    );

    await expect(tool(createInput())).rejects.toThrow('SoMark API error: invalid file');
  });

  test('throws SoMark API message when error detail is not a string', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 401,
        message: 'unauthorized',
        data: {
          error: { reason: 'bad key' }
        }
      })
    );

    await expect(tool(createInput())).rejects.toThrow('SoMark API error: unauthorized');
  });

  test('throws unknown error when SoMark gives no error detail', async () => {
    mockFetchFile();
    mockedPOST.mockResolvedValueOnce(
      mockResponse({
        code: 500,
        message: '',
        data: null
      })
    );

    await expect(tool(createInput())).rejects.toThrow('SoMark API error: unknown error');
  });
});

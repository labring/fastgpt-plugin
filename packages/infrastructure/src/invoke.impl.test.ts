import { Readable } from 'node:stream';

import type { InvokeUploadFileInputType } from '@domain/ports/invoke.port';
import { describe, expect, it } from 'vitest';

import { InvokeManager } from './plugin/invoke/invoke.impl';

type TestableInvokeManager = {
  buildUploadFileRequest(input: InvokeUploadFileInputType): Promise<{ formData: FormData }>;
};

describe('InvokeManager', () => {
  it('restores JSON-serialized Buffer chunks before building upload FormData', async () => {
    const manager = new InvokeManager({
      token: 'token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    }) as unknown as TestableInvokeManager;

    const request = await manager.buildUploadFileRequest({
      file: Readable.from([{ type: 'Buffer', data: [...Buffer.from('hello')] }], {
        objectMode: true
      }),
      fileName: 'hello.txt',
      contentType: 'text/plain'
    });

    const file = request.formData.get('file');

    expect(file).toBeInstanceOf(Blob);
    expect(await (file as Blob).text()).toBe('hello');
  });
});

import { z } from 'zod';
import axios, { type Method } from 'axios';
import { getErrText } from '@tool/utils/err';
import { delay } from '@tool/utils/delay';
import { htmlTable2Md } from '@tool/utils/markdown';
import { addLog } from '@/utils/log';

export const InputType = z.object({
  apikey: z.string(),
  files: z.array(z.string()),

  // @deprecated
  HTMLtable: z.boolean().optional()
});

export const OutputType = z.object({
  result: z.string(),
  success: z.boolean(),
  error: z.object({}).optional()
});

type ApiResponseDataType<T = any> = {
  code: string;
  msg?: string;
  data: T;
};

export const useDoc2xServer = ({ apiKey }: { apiKey: string }) => {
  // Init request
  const instance = axios.create({
    baseURL: 'https://v2.doc2x.noedgeai.com/api',
    timeout: 60000,
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  // Response check
  const checkRes = (data: ApiResponseDataType) => {
    if (data === undefined) {
      addLog.info('[Doc2x] Server data is empty');
      return Promise.reject('服务器异常');
    }
    return data;
  };
  const responseError = (err: any) => {
    if (!err) {
      return Promise.reject({ message: '[Doc2x] Unknown error' });
    }
    if (typeof err === 'string') {
      return Promise.reject({ message: `[Doc2x] ${err}` });
    }
    if (typeof err.data === 'string') {
      return Promise.reject({ message: `[Doc2x] ${err.data}` });
    }
    if (err?.response?.data) {
      return Promise.reject({ message: `[Doc2x] ${getErrText(err?.response?.data)}` });
    }
    if (typeof err.message === 'string') {
      return Promise.reject({ message: `[Doc2x] ${err.message}` });
    }

    addLog.error('[Doc2x] Unknown error', err);
    return Promise.reject({ message: `[Doc2x] ${getErrText(err)}` });
  };
  const request = <T>(url: string, data: any, method: Method): Promise<ApiResponseDataType<T>> => {
    // Remove empty data
    for (const key in data) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }

    return instance
      .request({
        url,
        method,
        data: ['POST', 'PUT'].includes(method) ? data : undefined,
        params: !['POST', 'PUT'].includes(method) ? data : undefined
      })
      .then((res) => checkRes(res.data))
      .catch((err) => responseError(err));
  };

  const parsePDF = async (fileBuffer: Buffer) => {
    addLog.debug('[Doc2x] PDF parse start');
    const startTime = Date.now();

    // 1. Get pre-upload URL first
    const {
      code,
      msg,
      data: preupload_data
    } = await request<{ uid: string; url: string }>('/v2/parse/preupload', {}, 'POST');
    if (!['ok', 'success'].includes(code)) {
      return Promise.reject(`[Doc2x] Failed to get pre-upload URL: ${msg}`);
    }
    const upload_url = preupload_data.url;
    const uid = preupload_data.uid;

    // 2. Upload file to pre-signed URL with binary stream
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const response = await axios
      .put(upload_url, blob, {
        headers: {
          'Content-Type': 'application/pdf'
        }
      })
      .catch((error) => {
        return Promise.reject(`[Doc2x] Failed to upload file: ${getErrText(error)}`);
      });
    if (response.status !== 200) {
      return Promise.reject(
        `[Doc2x] Upload failed with status ${response.status}: ${response.statusText}`
      );
    }
    addLog.debug(`[Doc2x] Uploaded file success, uid: ${uid}`);

    await delay(5000);

    // 3. Get the result by uid
    const checkResult = async () => {
      // 10 minutes
      let retry = 120;

      while (retry > 0) {
        try {
          const {
            code,
            data: result_data,
            msg
          } = await request<{
            progress: number;
            status: 'processing' | 'failed' | 'success';
            result: {
              pages: {
                md: string;
              }[];
            };
          }>(`/v2/parse/status?uid=${uid}`, null, 'GET');

          // Error
          if (!['ok', 'success'].includes(code)) {
            return Promise.reject(`[Doc2x] Failed to get result (uid: ${uid}): ${msg}`);
          }

          // Process
          if (['ready', 'processing'].includes(result_data.status)) {
            addLog.debug(`[Doc2x] Waiting for the result, uid: ${uid}`);
            await delay(5000);
          }

          // Finifsh
          if (result_data.status === 'success') {
            addLog.debug('resule', result_data.result);
            return {
              text: result_data.result.pages
                .map((page) => page.md)
                .join('')
                .replace(/\\[()]/g, '$')
                .replace(/\\[[\]]/g, '$$')
                .replace(/<img\s+src="([^"]+)"(?:\s*\?[^>]*)?(?:\s*\/>|>)/g, '![img]($1)')
                .replace(/<!-- Media -->/g, '')
                .replace(/<!-- Footnote -->/g, '')
                .replace(/<!-- Meanless:[\s\S]*?-->/g, '')
                .replace(/<!-- figureText:[\s\S]*?-->/g, '')
                .replace(/\$(.+?)\s+\\tag\{(.+?)\}\$/g, '$$$1 \\qquad \\qquad ($2)$$')
                .replace(/\\text\{([^}]*?)(\b\w+)_(\w+\b)([^}]*?)\}/g, '\\text{$1$2\\_$3$4}')
                .trim(),
              pages: result_data.result.pages.length
            };
          }
        } catch (error) {
          // Just network error
          addLog.warn(`[Doc2x] Get result error`, { error });
          await delay(500);
        }

        retry--;
      }
      return Promise.reject(`[Doc2x] Failed to get result (uid: ${uid}): Process timeout`);
    };

    const { text, pages } = await checkResult();

    const formatText = htmlTable2Md(text);

    addLog.debug(`[Doc2x] PDF parse finished`, {
      time: `${Math.round((Date.now() - startTime) / 1000)}s`,
      pages
    });

    return {
      pages,
      text: formatText
    };
  };

  return {
    parsePDF
  };
};

export async function tool({
  apikey,
  files
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  if (!apikey) {
    return Promise.reject(`API key is required`);
  }
  const successResult: string[] = [];
  const failedResult: string[] = [];

  const doc2x = useDoc2xServer({ apiKey: apikey });

  //Process each file one by one
  for await (const url of files) {
    try {
      //Fetch the pdf and check its content type
      const PDFResponse = await axios
        .get(url, {
          responseType: 'arraybuffer',
          proxy: false,
          timeout: 20000
        })
        .catch((error) => {
          throw new Error(`[Fetch PDF Error] Failed to fetch PDF: ${getErrText(error)}`);
        });

      if (PDFResponse.status !== 200) {
        throw new Error(
          `[Fetch PDF Error] Failed with status ${PDFResponse.status}: ${PDFResponse.data}`
        );
      }

      const contentType = PDFResponse.headers['content-type'];
      if (!contentType || !contentType.startsWith('application/pdf')) {
        continue;
      }

      const result = await doc2x.parsePDF(Buffer.from(PDFResponse.data));
      successResult.push(result.text);
    } catch (error) {
      failedResult.push(getErrText(error));
    }
  }

  return {
    result: successResult.join('\n------\n'),
    error: failedResult.join('\n------\n'),
    success: failedResult.length === 0
  };
}

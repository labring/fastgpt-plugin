import { format } from 'date-fns';
import { z } from 'zod';
import crypto from 'crypto';

export const InputType = z
  .object({
    accessKey: z.string().describe('accessKey'),
    secretKey: z.string().describe('secretKey'),
    prompt: z.string().describe('绘画提示词'),
    width: z.number().min(512).max(2048).describe('宽度'),
    height: z.number().min(512).max(2048).describe('高度')
  })
  .describe('libulibu star3 绘画参数');

export const OutputType = z.object({
  link: z.string().url().describe('绘画结果图片链接'),
  code: z.number().describe('状态码'),
  msg: z.string().describe('成功或者失败信息')
});

interface SignatureData {
  signature: string;
  timestamp: number;
  signature_nonce: string;
}

interface ImageData {
  imageUrl: string;
  seed: number;
  auditStatus: number;
}

function generateUrlSignature(urlPath: string, secretKey: string): SignatureData {
  const timestamp = Date.now();

  const nonce = crypto.randomBytes(8).toString('hex');

  const originalText = `${urlPath}&${timestamp}&${nonce}`;

  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(originalText, 'utf-8');
  const cipherTextBytes = hmac.digest();

  const base64Encoded = cipherTextBytes.toString('base64');

  const urlSafeSignature = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_');

  const finalSignature = urlSafeSignature.replace(/=+$/, '');

  return {
    signature: finalSignature,
    timestamp: timestamp,
    signature_nonce: nonce
  };
}

function buildRequestUrl(
  accessKey: string,
  secretKey: string,
  apiPath: string = '/api/generate/webui/text2img/ultra'
) {
  const BASE_URL = 'https://openapi.liblibai.cloud';

  const signatureData = generateUrlSignature(apiPath, secretKey);

  const params = new URLSearchParams({
    AccessKey: accessKey,
    Signature: signatureData.signature,
    Timestamp: signatureData.timestamp.toString(),
    SignatureNonce: signatureData.signature_nonce
  });

  const finalUrl = `${BASE_URL}${apiPath}?${params.toString()}`;

  return {
    AccessKey: accessKey,
    Signature: signatureData.signature,
    Timestamp: signatureData.timestamp,
    SignatureNonce: signatureData.signature_nonce,
    final_url: finalUrl
  };
}

async function queryTaskStatus(accessKey: string, secretKey: string, generateUuid: string) {
  const statusApiPath = '/api/generate/webui/status';
  const requestData = buildRequestUrl(accessKey, secretKey, statusApiPath);
  const requestBody = {
    generateUuid: generateUuid
  };

  const response = await fetch(requestData.final_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    return Promise.reject(new Error(`查询任务状态失败! status: ${response.status}`));
  }

  return await response.json();
}

function getStatusMessage(status: number | undefined): string {
  switch (status) {
    case 1:
      return '任务排队中';
    case 2:
      return '任务进行中';
    case 3:
      return '任务已完成，等待审核';
    case 4:
      return '任务失败';
    case 5:
      return '任务完成';
    default:
      return `未知状态 (${status})`;
  }
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessKey, secretKey, prompt, width, height } = props;

  try {
    const requestData = buildRequestUrl(accessKey, secretKey);

    const requestBody = {
      templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
      generateParams: {
        prompt: prompt,
        imageSize: {
          width: width,
          height: height
        },
        imgCount: 1,
        steps: 30
      }
    };

    const response = await fetch(requestData.final_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
    }

    const result = await response.json();

    if (result.data?.generateUuid) {
      const generateUuid = result.data.generateUuid;

      const maxRetries = 30;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const statusResult = await queryTaskStatus(accessKey, secretKey, generateUuid);

          if (statusResult.data?.generateStatus === 5) {
            const images = statusResult.data.images || [];

            if (images.length > 0) {
              const validImage = images.find(
                (img: ImageData) => img.imageUrl && img.imageUrl.trim() !== ''
              );

              if (validImage && validImage.imageUrl) {
                return {
                  link: validImage.imageUrl,
                  code: 0,
                  msg: 'success'
                };
              } else {
                return {
                  link: '',
                  code: 1,
                  msg: '任务完成但未找到有效的图片链接'
                };
              }
            } else {
              return {
                link: '',
                code: 1,
                msg: '任务完成但图片列表为空，可能图片未通过审核'
              };
            }
          } else if (statusResult.data?.generateStatus === 4) {
            const errorMsg = statusResult.data.generateMsg || '图片生成任务失败';
            return {
              link: '',
              code: 1,
              msg: errorMsg
            };
          } else {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        retryCount++;
      }

      return {
        link: generateUuid,
        code: 1,
        msg: 'failed'
      };
    }

    return {
      link:
        result.link || result.image_url || result.data?.imageUrl || 'https://www.liblib.art/apis',
      code: result.code || 0,
      msg: result.msg || 'success'
    };
  } catch (error) {
    return {
      link: '',
      code: 1,
      msg: '调用 libulibu API 时发生错误'
    };
  }
}

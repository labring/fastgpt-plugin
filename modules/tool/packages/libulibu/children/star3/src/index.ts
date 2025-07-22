import { z } from 'zod';
import crypto from 'crypto';
import { delay } from '@tool/utils/delay';

const SizeEnum = z.enum(['512*1024', '768*512', '768*1024', '1024*576', '576*1024', '1024*1024']);

export const InputType = z
  .object({
    accessKey: z.string().describe('accessKey'),
    secretKey: z.string().describe('secretKey'),
    prompt: z.string().describe('draw prompt'),
    size: SizeEnum.optional().default('1024*1024').describe('image size')
  })
  .describe('libulibu star3 drawing parameters');

export const OutputType = z.object({
  link: z.string().describe('drawing result image link'),
  msg: z.string().optional().describe('error message, returned when task execution fails')
});

function generateUrlSignature(urlPath: string, secretKey: string) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  const originalText = `${urlPath}&${timestamp}&${nonce}`;

  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(originalText, 'utf-8');
  const cipherTextBytes = hmac.digest();

  const base64Encoded = cipherTextBytes.toString('base64');
  const urlSafeSignature = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return {
    signature: urlSafeSignature,
    timestamp: timestamp,
    signature_nonce: nonce
  };
}

function buildRequestUrl(accessKey: string, secretKey: string, apiPath: string) {
  const BASE_URL = 'https://openapi.liblibai.cloud';
  const signatureData = generateUrlSignature(apiPath, secretKey);

  const params = new URLSearchParams({
    AccessKey: accessKey,
    Signature: signatureData.signature,
    Timestamp: signatureData.timestamp.toString(),
    SignatureNonce: signatureData.signature_nonce
  });

  return `${BASE_URL}${apiPath}?${params.toString()}`;
}

async function submitDrawingTask(
  accessKey: string,
  secretKey: string,
  prompt: string,
  size: string
) {
  const apiPath = '/api/generate/webui/text2img/ultra';
  const url = buildRequestUrl(accessKey, secretKey, apiPath);

  const requestBody = {
    templateUuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
    generateParams: {
      prompt: prompt,
      imageSize: {
        width: Number(size.split('*')[0]),
        height: Number(size.split('*')[1])
      },
      imgCount: 1,
      steps: 30
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    return Promise.reject(new Error(`提交绘画任务失败: HTTP ${response.status}`));
  }

  return await response.json();
}

async function queryTaskStatus(accessKey: string, secretKey: string, generateUuid: string) {
  const apiPath = '/api/generate/webui/status';
  const url = buildRequestUrl(accessKey, secretKey, apiPath);

  const requestBody = {
    generateUuid: generateUuid
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    return Promise.reject(new Error(`查询任务状态失败: HTTP ${response.status}`));
  }

  return await response.json();
}

async function waitForTaskCompletion(
  accessKey: string,
  secretKey: string,
  generateUuid: string,
  retryCount: number = 30
): Promise<{ link: string; msg?: string }> {
  if (retryCount <= 0) {
    return {
      link: '',
      msg: '任务超时，请稍后重试'
    };
  }

  try {
    const statusResult = await queryTaskStatus(accessKey, secretKey, generateUuid);
    const generateStatus = statusResult.data?.generateStatus;

    if (generateStatus === 5) {
      const images = statusResult.data?.images || [];

      if (images.length === 0) {
        return {
          link: '',
          msg: '任务完成但图片列表为空，可能图片未通过审核'
        };
      }

      const validImage = images.find((img: any) => img.imageUrl && img.imageUrl.trim() !== '');

      if (!validImage?.imageUrl) {
        return {
          link: '',
          msg: '任务完成但未找到有效的图片链接'
        };
      }

      return {
        link: validImage.imageUrl
      };
    }

    if (generateStatus === 4) {
      const errorMsg = statusResult.data?.generateMsg || '图片生成任务失败';
      return {
        link: '',
        msg: errorMsg
      };
    }

    await delay(3000);
    return waitForTaskCompletion(accessKey, secretKey, generateUuid, retryCount - 1);
  } catch (error) {
    console.error(`查询任务状态失败，剩余重试次数: ${retryCount - 1}`, {
      error: error instanceof Error ? error.message : String(error),
      generateUuid: generateUuid
    });

    await delay(3000);
    return waitForTaskCompletion(accessKey, secretKey, generateUuid, retryCount - 1);
  }
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessKey, secretKey, prompt, size } = props;

  try {
    const result = await submitDrawingTask(accessKey, secretKey, prompt, size);

    if (!result.data?.generateUuid) {
      return {
        link: '',
        msg: '提交任务失败，未获取到任务ID'
      };
    }

    return await waitForTaskCompletion(accessKey, secretKey, result.data.generateUuid);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '调用 libulibu API 时发生未知错误';
    return Promise.reject(new Error(errorMessage));
  }
}

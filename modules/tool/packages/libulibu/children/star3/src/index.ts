import { z } from 'zod';
import crypto from 'crypto';
import { delay } from '@tool/utils/delay';
const SizeEnum = z.enum(['512*1024', '768*512', '768*1024', '1024*576', '576*1024', '1024*1024']);

const TaskType = z.enum(['text2img', 'check']);
const apiMap = {
  text2img: '/api/generate/webui/text2img/ultra',
  check: '/api/generate/webui/status'
};

export const InputType = z
  .object({
    accessKey: z.string().describe('accessKey'),
    secretKey: z.string().describe('secretKey'),
    prompt: z.string().describe('draw prompt'),
    size: SizeEnum.optional().default('1024*1024').describe('Resolution of the generated image')
  })
  .describe('libulibu star3 draw params');

export const OutputType = z.object({
  link: z.string().url().describe('draw result image link'),
  msg: z.string().describe('success or failed message')
});

type SignatureData = {
  signature: string;
  timestamp: number;
  signature_nonce: string;
};

type ImageData = {
  imageUrl: string;
  seed: number;
  auditStatus: number;
};

type TaskResult = {
  link: string;
  msg: string;
};

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

function buildRequestUrl(accessKey: string, secretKey: string, taskType: z.infer<typeof TaskType>) {
  const BASE_URL = 'https://openapi.liblibai.cloud';

  const apiPath: string = apiMap[taskType];
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
  const requestData = buildRequestUrl(accessKey, secretKey, 'check');
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

function processTaskResult(statusResult: any): TaskResult {
  const images = statusResult.data?.images || [];

  if (images.length === 0) {
    return {
      link: '',
      msg: '任务完成但图片列表为空，可能图片未通过审核'
    };
  }

  const validImage = images.find((img: ImageData) => img.imageUrl && img.imageUrl.trim() !== '');

  if (!validImage?.imageUrl) {
    return {
      link: '',
      msg: '任务完成但未找到有效的图片链接'
    };
  }

  return {
    link: validImage.imageUrl,
    msg: 'success'
  };
}

async function waitForTaskCompletion(
  accessKey: string,
  secretKey: string,
  generateUuid: string,
  maxRetries: number = 30
): Promise<TaskResult> {
  if (maxRetries === 0) {
    return {
      link: generateUuid,
      msg: 'failed'
    };
  }

  try {
    const statusResult = await queryTaskStatus(accessKey, secretKey, generateUuid);
    const generateStatus = statusResult.data?.generateStatus;

    if (generateStatus === 5) {
      return processTaskResult(statusResult);
    }

    if (generateStatus === 4) {
      const errorMsg = statusResult.data?.generateMsg || '图片生成任务失败';
      return {
        link: '',
        msg: errorMsg
      };
    }

    await delay(3000);
    return waitForTaskCompletion(accessKey, secretKey, generateUuid, maxRetries - 1);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessKey, secretKey, prompt, size } = props;

  try {
    const requestData = buildRequestUrl(accessKey, secretKey, 'text2img');

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
      return await waitForTaskCompletion(accessKey, secretKey, result.data.generateUuid);
    }

    return {
      link:
        result.link || result.image_url || result.data?.imageUrl || 'https://www.liblib.art/apis',
      msg: result.msg || 'success'
    };
  } catch (error) {
    return {
      link: '',
      msg: '调用 libulibu API 时发生错误'
    };
  }
}

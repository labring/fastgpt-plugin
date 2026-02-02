import { z } from 'zod';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

export const createHmac = (algorithm: string, secret: string) => {
  const timestamp = Date.now().toString();
  const stringToSign = `${timestamp}\n${secret}`;

  // 创建 HMAC
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(stringToSign, 'utf8');
  const signData = hmac.digest();

  const sign = querystring.escape(Buffer.from(new Uint8Array(signData)).toString('base64'));

  return {
    timestamp,
    sign
  };
};

export const InputType = z
  .object({
    钉钉机器人地址: z.string().optional(), // 兼容旧版
    webhookUrl: z.string().optional(),
    加签值: z.string().optional(), // 兼容旧版
    secret: z.string().optional(),
    发送的消息: z.string().optional(), // 兼容旧版
    message: z.string().optional()
  })
  .refine(
    (data) => {
      return (
        (data.钉钉机器人地址 || data.webhookUrl) &&
        (data.加签值 || data.secret) &&
        (data.发送的消息 || data.message)
      );
    },
    {
      message: '必须传入机器人地址、加签值和消息内容'
    }
  )
  .transform((data) => ({
    webhookUrl: data.webhookUrl || data.钉钉机器人地址,
    secret: data.secret || data.加签值,
    message: data.message || data.发送的消息
  }));

export const OutputType = z.object({});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { webhookUrl, secret, message } = props;
  const { sign, timestamp } = createHmac('sha256', secret!);
  const url = new URL(webhookUrl!);
  url.searchParams.append('timestamp', timestamp);
  url.searchParams.append('sign', sign);

  await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      msgtype: 'text',
      text: {
        content: message!
      }
    })
  });

  return {};
}

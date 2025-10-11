import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  apiKey: z.string(),
  text: z.string().nonempty(),
  model: z.string().nonempty(),
  voice_id: z.string(),
  speed: z.number(),
  vol: z.number(),
  pitch: z.number(),
  emotion: z.string(),
  english_normalization: z.boolean()
});

export const OutputType = z.object({
  audioUrl: z.string()
});

const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1';

export async function tool({
  apiKey,
  text,
  model,
  voice_id,
  speed,
  vol,
  pitch,
  emotion,
  english_normalization
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const { data: syncData } = await POST(
    `${MINIMAX_BASE_URL}/t2a_v2`,
    {
      model,
      text,
      stream: false,
      language_boost: 'auto',
      voice_setting: {
        voice_id,
        speed,
        vol,
        pitch,
        emotion,
        english_normalization
      }
    },
    {
      headers
    }
  );
  if (syncData.base_resp.status_code !== 0) {
    return Promise.reject(
      ErrorCodeMap[syncData.base_resp.status_code as keyof typeof ErrorCodeMap]
    );
  }

  // convert hex audio data to buffer
  const hexAudioData = syncData.data.audio;
  const audioBuffer = Buffer.from(hexAudioData, 'hex');
  if (audioBuffer.length === 0) {
    return Promise.reject('Failed to convert audio data');
  }

  const { accessUrl: audioUrl } = await uploadFile({
    buffer: audioBuffer,
    defaultFilename: 'minimax_tts.mp3'
  });
  if (!audioUrl) {
    return Promise.reject('Failed to upload audio file');
  }

  return { audioUrl };
}

const ErrorCodeMap = {
  1000: '未知错误/系统默认错误',
  1001: '请求超时',
  1002: '请求频率超限',
  1004: '未授权/Token不匹配/Cookie缺失',
  1008: '余额不足',
  1024: '内部错误',
  1026: '输入内容涉敏',
  1027: '输出内容涉敏',
  1033: '系统错误/下游服务错误',
  1039: 'Token限制',
  1041: '连接数限制',
  1042: '不可见字符比例超限/非法字符超过10%',
  1043: 'ASR相似度检查失败',
  1044: '克隆提示词相似度检查失败',
  2013: '参数错误',
  20132: '语音克隆样本或voice_id参数错误',
  2037: '语音时长不符合要求(太长或太短)',
  2038: '用户语音克隆功能被禁用',
  2039: '语音克隆voice_id重复',
  2042: '无权访问该voice_id',
  2045: '请求频率增长超限',
  2048: '语音克隆提示音频太长',
  2049: '无效的API Key'
};

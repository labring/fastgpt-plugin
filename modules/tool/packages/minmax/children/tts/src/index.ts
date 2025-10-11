import { z } from 'zod';
import { POST, GET } from '@tool/utils/request';
import { uploadFile } from '@tool/utils/uploadFile';
import { delay } from '@tool/utils/delay';
import { addLog } from '@/utils/log';

export const InputType = z.object({
  apiKey: z.string().nonempty(),
  text: z.string().nonempty(),
  model: z.enum([
    'speech-2.5-hd-preview',
    'speech-2.5-turbo-preview',
    'speech-02-hd',
    'speech-02-turbo',
    'speech-01-hd',
    'speech-01-turbo'
  ]),
  voice_id: z.enum(['male-qn-qingse', 'male-qn-jingying', 'female-shaonv', 'female-chengshu']),
  speed: z.number().min(0.5).max(2),
  vol: z.number().min(0.1).max(10),
  pitch: z.number().min(-12).max(12),
  emotion: z.enum(['auto', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm']),
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
  // these params are advanced settings, now not allow user to customize
  const defaultSetting = {
    pronunciation_dict: {
      tone: []
    },
    audio_setting: {
      audio_sample_rate: 32000,
      bitrate: 128000,
      format: 'mp3',
      channel: 2
    },
    voice_modify: {
      pitch: 0,
      intensity: 0,
      timbre: 0,
      sound_effects: 'spacious_echo'
    }
  };

  // 1. Create tts task
  const { data: taskData } = await POST(
    `${MINIMAX_BASE_URL}/t2a_async_v2`,
    {
      model,
      text,
      language_boost: 'auto',
      voice_setting: {
        voice_id,
        speed,
        vol,
        pitch,
        emotion,
        english_normalization
      },
      ...defaultSetting
    },
    {
      headers
    }
  );

  const task_id = taskData.task_id;
  console.log(taskData, 222);
  // 2. Polling task status until success or failed
  // file can be downloaded when task status is success
  const pollTaskStatus = async () => {
    const maxRetries = 180;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await delay(2000);
        const { data: statusData } = await GET(`${MINIMAX_BASE_URL}/query/t2a_async_query_v2`, {
          params: { task_id },
          headers
        });
        const status = statusData.status;
        if (status === 'Success') {
          return statusData.file_id;
        }
        if (status === 'Failed') {
          return Promise.reject('TTS task failed');
        }
      } catch (error) {
        addLog.error('TTS task polling failed', { error });
      }
    }
    return Promise.reject('TTS task timeout');
  };
  const file_id = await pollTaskStatus();

  // 3. Retrieve file content
  const { data: fileBuffer } = await GET(`${MINIMAX_BASE_URL}/files/retrieve_content`, {
    params: { file_id },
    headers,
    responseType: 'arrayBuffer'
  });

  const { accessUrl: audioUrl } = await uploadFile({
    buffer: Buffer.from(fileBuffer),
    defaultFilename: 'tts.mp3'
  });

  return { audioUrl };
}

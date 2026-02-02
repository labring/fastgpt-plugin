import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { uploadFile } from '@tool/utils/uploadFile';
import { ErrorCodeMap } from '@tool/packages/minimax/constants';

export const InputType = z.object({
  apiKey: z.string().nonempty(),
  text: z.string().nonempty(),
  model: z.string().nonempty(),
  voice_id: z.string(),
  speed: z.number().min(0.5).max(2),
  vol: z.number().min(0.1).max(10),
  pitch: z.number().min(-12).max(12),
  emotion: z.enum(['', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm']),
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
        ...(emotion && { emotion }),
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

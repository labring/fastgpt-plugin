import { z } from 'zod';
import { POST, GET } from '@tool/utils/request';

export const InputType = z.object({
  apiKey: z.string(),
  text: z.string(),
  color: z.string().optional()
});

export const OutputType = z.object({
  preview_url: z.string()
});

type CreatePPTResponse = {
  id: string;
  images_url: {
    url: string;
    time: number;
  }[];
  note_status: number;
  introduce: string;
  ppt_title: string;
  page_count: number;
  progress: number;
  status: number;
  first_image_up_at: string;
  created_at: string;
  updated_at: string;
  state_description: string;
  process_url: string;
  preview_url: string;
};

export async function tool({ apiKey, text, color }: z.infer<typeof InputType>) {
  const token = `Bearer ${apiKey}`;
  const CHATPPT_BASE_URL = 'https://saas.api.yoo-ai.com';

  const createPPTRes = await POST<{ data: { id: string } }>(
    `${CHATPPT_BASE_URL}/apps/ppt-create`,
    {
      text,
      color
    },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    }
  );
  const id = createPPTRes?.data?.data?.id;
  if (!id || typeof id !== 'string') {
    return Promise.reject('Failed to create PPT: empty id');
  }

  const getPPTUrlRes = await GET<{ data: CreatePPTResponse }>(
    `${CHATPPT_BASE_URL}/apps/ppt-result`,
    {
      params: {
        id
      },
      headers: {
        Authorization: token
      }
    }
  );
  const preview_url = getPPTUrlRes?.data?.data?.preview_url;
  if (!preview_url || typeof preview_url !== 'string') {
    return Promise.reject('Failed to fetch PPT preview url');
  }

  return {
    preview_url
  };
}

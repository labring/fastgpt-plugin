import { POST, GET } from '@tool/utils/request';

const CHATPPT_BASE_URL = 'https://saas.api.yoo-ai.com';

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

export async function createPPT(token: string, text: string, color: string): Promise<string> {
  const url = `${CHATPPT_BASE_URL}/apps/ppt-create`;
  const res = await POST<{ data: { id: string } }>(
    url,
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
  const id = res?.data?.data?.id;
  if (!id || typeof id !== 'string') {
    throw new Error('Failed to create PPT: empty id');
  }
  return id;
}

export async function getPPTPreviewUrl(token: string, id: string): Promise<string> {
  const url = `${CHATPPT_BASE_URL}/apps/ppt-result`;
  const res = await GET<{ data: CreatePPTResponse }>(url, {
    params: {
      id
    },
    headers: {
      Authorization: token
    }
  });
  const preview_url = res?.data?.data?.preview_url;
  if (!preview_url || typeof preview_url !== 'string') {
    throw new Error('Failed to fetch PPT preview url');
  }
  return preview_url;
}

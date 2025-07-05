import { addLog } from '@/utils/log';
import { z } from 'zod';

export const InputType = z.object({
  content: z.string(),
  hook_url: z.string()
});

export const OutputType = z.object({
  result: z.object({
    code: z.number(),
    msg: z.string()
  })
});

// support json or plaintext:
// if json, just return it (for supporting customized message)
// if plaintext, wrap it with json
function format(content: string) {
  try {
    return JSON.parse(content);
  } catch (err) {
    return {
      msg_type: 'text',
      content: {
        text: content
      }
    };
  }
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { content, hook_url } = props;
  const data = format(content);
  const response = await fetch(hook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return {
    result: await response.json()
  };
}

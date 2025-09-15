import { uploadFile } from '@tool/utils/uploadFile';
import { z } from 'zod';

export const InputType = z.object({
  base_url: z.string(),
  token: z.string().optional().default(''),
  files: z.array(z.string()),
  parse_method: z.string().optional().default('auto'),
  formula_enable: z.boolean().optional().default(true),
  table_enable: z.boolean().optional().default(true),
  return_md: z.boolean().optional().default(true),
  return_content_list: z.boolean().optional().default(false),
  lang_list: z.string().optional().default('ch'),
  backend: z.string().optional().default('pipeline'),
  sglang_server_url: z.string().optional().default('')
});

interface InnerPropsType extends z.infer<typeof InputType> {
  headers: Record<string, string>;
}

interface ParsedResultItemType {
  images: Record<string, string>;
  content_list?: string;
  md_content: string;
}

interface ParsedResultType {
  results: Record<string, ParsedResultItemType>;
}

const ResultItemType = z.object({
  filename: z.string(),
  images: z.array(z.string()).optional(),
  content_list: z.array(z.any()).optional(),
  md_content: z.string().optional()
});

type ResultItemType = z.infer<typeof ResultItemType>;

export const OutputType = z.object({
  result: z.record(z.array(ResultItemType))
});

function buildHeaders(token?: string) {
  if (token) {
    return {
      Authorization: `Bearer ${token}`
    };
  }

  return {};
}

async function uploadBase64Image(filename: string, content: string) {
  const { accessUrl } = await uploadFile({
    base64: content,
    defaultFilename: filename
  });

  return accessUrl;
}

function replaceImageUrl(content: string, images: Record<string, string>) {
  for (const [key, value] of Object.entries(images)) {
    content = content.replace(new RegExp(`images/${key}`, 'g'), value);
  }
  return content;
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { base_url, token, lang_list } = props;

  if (!base_url) {
    return Promise.reject('MinerU base url is required');
  }

  const innerProps: InnerPropsType = {
    ...props,
    headers: buildHeaders(token) as Record<string, string>
  };

  const { files } = innerProps;
  let langList = lang_list.split(',').map((item) => item.trim());

  if (langList.length === 0) {
    langList = ['ch'];
  }

  const url = `${base_url}/file_parse`;
  const result: Record<string, ResultItemType[]> = {};
  const formData = new FormData();

  for (const filePath of files) {
    const fileblob = await fetch(filePath).then((res) => res.blob());
    const baseName = filePath.split('?')[0].split('/').pop();
    formData.append('files', fileblob, baseName);
  }

  formData.append('server_url', innerProps.sglang_server_url);
  formData.append('lang_list', innerProps.lang_list);
  formData.append('backend', innerProps.backend);
  formData.append('parse_method', innerProps.parse_method);
  formData.append('formula_enable', innerProps.formula_enable.toString());
  formData.append('table_enable', innerProps.table_enable.toString());
  formData.append('return_md', innerProps.return_md.toString());
  formData.append('return_content_list', innerProps.return_content_list.toString());
  formData.append('return_images', true.toString());

  const requestHeaders: Record<string, string> = { ...innerProps.headers };

  const res = await fetch(url, {
    method: 'POST',
    headers: requestHeaders,
    body: formData
  });

  if (res.status !== 200) {
    return Promise.reject(`Parse failed: ${res.status} ${res.statusText} ${await res.text()}`);
  }

  const data: ParsedResultType = await res.json();

  if (!data.results) {
    return Promise.reject('Parsed result is empty');
  }

  for (const [parsedFilename, result_item] of Object.entries(data.results ?? {})) {
    const item: ResultItemType = {
      filename: parsedFilename
    };
    const images: Record<string, string> = {};

    if (result_item.images) {
      item.images = [];
      for (const [key, value] of Object.entries(result_item.images)) {
        const accessUrl = await uploadBase64Image(key, value);
        item.images.push(accessUrl);
        images[key] = accessUrl;
      }
    }

    if (result_item.content_list) {
      try {
        item.content_list = JSON.parse(result_item.content_list);
      } catch {
        throw new Error('content_list is not a valid JSON string');
      }
    }

    if (result_item.md_content) {
      item.md_content = replaceImageUrl(result_item.md_content, images);
    }

    if (!result[parsedFilename]) {
      result[parsedFilename] = [];
    }
    result[parsedFilename].push(item);
  }

  return {
    result
  };
}

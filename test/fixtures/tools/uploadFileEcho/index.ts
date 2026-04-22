import { createToolHandler, defineTool } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    content: z.string()
  }),
  outputSchema: z.object({
    accessURL: z.string(),
    fileName: z.string(),
    size: z.number()
  }),
  handler: async (input, { invoke }) => {
    const [result, err] = await invoke.uploadFile({
      fileName: 'echo.txt',
      contentType: 'text/plain',
      file: Buffer.from(input.content, 'utf-8')
    });

    if (err || !result) {
      throw new Error('uploadFile 调用失败');
    }

    return {
      accessURL: result.accessURL,
      fileName: result.fileName,
      size: result.size
    };
  }
});

export default defineTool({
  manifest: {
    description: {
      en: 'Upload content to the local debug host',
      'zh-CN': '把内容上传到本地调试宿主'
    },
    name: {
      en: 'Upload File Echo',
      'zh-CN': '上传文件回显'
    },
    pluginId: 'uploadFileEcho',
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    }
  },
  handler
});

import type { ToolType } from './type';

export const uploadedTools: ToolType[] = [];
export const builtinTools: ToolType[] = [];

export const UploadToolsS3Path = 'system/tools';

export const serviceRequestMaxContentLength =
  Number(process.env.SERVICE_REQUEST_MAX_CONTENT_LENGTH || 10) * 1024 * 1024; // 10MB

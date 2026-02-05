import type { FileInput } from '@/lib/s3/type';
import { getPublicS3Server } from '@/lib/s3';
import { getCurrentToolPrefix } from '@/utils/context';

// Extend global type to access currentToolPrefix set by worker
declare global {
  var currentToolPrefix: string | undefined;
}

export const uploadFile = async (data: FileInput) => {
  const publicS3Server = getPublicS3Server();
  if (!publicS3Server) {
    throw new Error(
      'S3 Server not initialized in global context. If you are in dev mode, please ensure the system is initialized.'
    );
  }

  //  从 AsyncLocalStorage 的上下文中获取前缀（用于非 worker 环境）
  const prefix = getCurrentToolPrefix();

  return await publicS3Server.uploadFileAdvanced({
    ...data,
    ...(data.buffer ? { buffer: data.buffer } : {}),
    prefix
  });
};

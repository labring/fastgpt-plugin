import type { Result } from '../value-objects/result.vo';

export interface FileTTLPort {
  setExpiration(fileKeys: string[], bucketName: string, expiresAt: Date): Promise<Result>;
  cleanExpired(): Promise<Result>;
}

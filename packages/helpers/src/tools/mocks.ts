import { vi } from 'vitest';
import type { EventEmitter } from '../events/type';
import type { SystemVarType } from './schemas/req';
import type { FileMetadata } from '../common/schemas/s3';

export const mockedSystemVar: SystemVarType = {
  user: {
    id: 'mock-user-id',
    username: 'mock-username',
    contact: 'mock@example.com',
    membername: 'Mock Member',
    teamName: 'Mock Team',
    teamId: 'mock-team-id',
    name: 'Mock User'
  },
  app: {
    id: 'mock-app-id',
    name: 'Mock Application'
  },
  tool: {
    id: 'mock-tool-id',
    version: '1.0.0',
    prefix: 'mock-prefix'
  },
  time: new Date().toISOString()
};

export const mockedEventEmitter: EventEmitter = {
  uploadFile: vi.fn().mockResolvedValue({
    accessUrl: 'https://mock-access-url.com',
    contentType: 'image/jpeg',
    objectName: 'mock-object-name',
    originalFilename: 'mock-original-filename',
    size: 1024,
    uploadTime: new Date()
  } as FileMetadata),

  streamResponse: vi.fn(),

  html2md: vi.fn().mockResolvedValue('# Mock Markdown\n\nConverted from HTML.'),

  cherrio2md: vi.fn().mockResolvedValue({
    markdown: '# Mock Markdown\n\nFetched from URL',
    title: 'Mock Title',
    usedSelector: 'body'
  })
};

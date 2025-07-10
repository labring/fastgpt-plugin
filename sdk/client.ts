import createClient from '@/contract/client';
import type { SystemVarType } from '@tool/type/tool';
import type { StreamMessage } from '@tool/type/stream';

export default createClient;

export type { SystemVarType, StreamMessage as SSEMessage };

export { runToolStream } from './runToolStream';

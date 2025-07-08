import createClient from '@/contract/client';
import type { SystemVarType } from '@tool/type/tool';
import type { SSEMessage } from '@tool/type/stream';

export default createClient;

export type { SystemVarType, SSEMessage };

export { runToolStream } from './runToolStream';

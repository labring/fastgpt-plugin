import createClient from '@/contract/client';
import type { SystemVarType } from '@tool/type/tool';
import type { StreamMessageType } from '@tool/type/stream';

export default createClient;

export type { SystemVarType, StreamMessageType as StreamMessage };

export { runToolStream } from './runToolStream';

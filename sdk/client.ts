import createClient from '@/contract/client';
import type { SystemVarType } from '@tool/type/tool';
import type { StreamMessageType } from '@tool/type/tool';
export default createClient;
import { ToolTypeEnum, ToolTypeTranslations } from '@tool/type/tool';

export type { SystemVarType, StreamMessageType as StreamMessage };
export { RunToolWithStream } from './runToolStream';
export { StreamDataAnswerTypeEnum } from '@tool/type/tool';

export { ToolTypeEnum, ToolTypeTranslations };

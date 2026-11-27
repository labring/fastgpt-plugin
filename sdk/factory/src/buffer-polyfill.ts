import * as bufferModule from 'buffer/';

const runtimeBuffer = bufferModule as Record<string, unknown>;

export const Buffer = bufferModule.Buffer;
export const SlowBuffer = runtimeBuffer.SlowBuffer;
export const INSPECT_MAX_BYTES = runtimeBuffer.INSPECT_MAX_BYTES;
export const kMaxLength = runtimeBuffer.kMaxLength;
export default bufferModule;

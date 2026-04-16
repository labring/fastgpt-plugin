import type { Result } from '../../value-objects/result.vo';
import type { StreamData } from '../../value-objects/stream.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '../../value-objects/tool.vo';

export interface ToolManagerPort {
  run(arg0: ToolRunInputType): Promise<Result<StreamData<ToolStreamMessageType>>>;
}

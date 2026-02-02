import { z } from 'zod';
import { ToolCallbackReturnSchema } from '../schemas/tool';

// ==================== Module-specific Schemas (with callback) ====================

export type ToolCallbackReturnSchemaType = z.infer<typeof ToolCallbackReturnSchema>;

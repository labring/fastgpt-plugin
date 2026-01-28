// Re-export from validates
export {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  LLMModelTypeEnum,
  FlowNodeOutputTypeEnum,
  InputConfigSchema,
  InputSchema,
  OutputSchema,
  type InputConfigType,
  type InputType,
  type OutputType
} from '@/validates/tool';

// Module-specific enum
export enum SystemInputKeyEnum {
  systemInputConfig = 'system_input_config'
}

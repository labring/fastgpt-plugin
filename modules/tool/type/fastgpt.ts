import { z } from 'zod';

export enum SystemInputKeyEnum {
  systemInputConfig = 'system_input_config'
}

export enum FlowNodeInputTypeEnum { // render ui
  reference = 'reference', // reference to other node output
  input = 'input', // one line input
  textarea = 'textarea',
  numberInput = 'numberInput',
  switch = 'switch', // true/false
  select = 'select',
  multipleSelect = 'multipleSelect',

  // editor
  JSONEditor = 'JSONEditor',

  addInputParam = 'addInputParam', // params input

  // special input
  selectApp = 'selectApp',
  customVariable = 'customVariable',

  // ai model select
  selectLLMModel = 'selectLLMModel',
  settingLLMModel = 'settingLLMModel',

  // dataset special input
  selectDataset = 'selectDataset',
  selectDatasetParamsModal = 'selectDatasetParamsModal',
  settingDatasetQuotePrompt = 'settingDatasetQuotePrompt',

  hidden = 'hidden',
  custom = 'custom',

  fileSelect = 'fileSelect'
}

export enum WorkflowIOValueTypeEnum {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',

  arrayString = 'arrayString',
  arrayNumber = 'arrayNumber',
  arrayBoolean = 'arrayBoolean',
  arrayObject = 'arrayObject',
  arrayAny = 'arrayAny',
  any = 'any',

  chatHistory = 'chatHistory',
  datasetQuote = 'datasetQuote',

  dynamic = 'dynamic',

  // plugin special type
  selectDataset = 'selectDataset',

  // abandon
  selectApp = 'selectApp'
}

export enum LLMModelTypeEnum {
  all = 'all',
  classify = 'classify',
  extractFields = 'extractFields',
  toolCall = 'toolCall'
}

export enum FlowNodeOutputTypeEnum {
  hidden = 'hidden',
  source = 'source',
  static = 'static',
  dynamic = 'dynamic',
  error = 'error'
}

// Define InputConfigType schema
export const InputConfigSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  inputType: z.enum(['input', 'numberInput', 'secret', 'switch', 'select']),

  // select
  list: z
    .array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    )
    .optional()
});
export type InputConfigType = z.infer<typeof InputConfigSchema>;

// Define InputType schema
export const InputSchema = z.object({
  key: z.string(),
  label: z.string(),
  referencePlaceholder: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  selectedTypeIndex: z.number().optional(),
  renderTypeList: z.array(z.nativeEnum(FlowNodeInputTypeEnum)),
  valueType: z.nativeEnum(WorkflowIOValueTypeEnum),
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  toolDescription: z.string().optional(),
  canEdit: z.boolean().optional(),
  isPro: z.boolean().optional(),

  // Different from renderType
  // String input
  maxLength: z.number().optional(),
  //  Selecet files
  canSelectFile: z.boolean().optional(),
  canSelectImg: z.boolean().optional(),
  maxFiles: z.number().optional(),
  // Input config
  inputList: z.array(InputConfigSchema).optional(),
  // Select model
  llmModelType: z.nativeEnum(LLMModelTypeEnum).optional(),
  // options
  list: z
    .array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    )
    .optional(),
  // Slider
  markList: z
    .array(
      z.object({
        label: z.string(),
        value: z.number()
      })
    )
    .optional(),
  // Number input/ Slider
  step: z.number().optional(),
  // number input
  max: z.number().optional(),
  min: z.number().optional(),
  precision: z.number().optional()
});
export type InputType = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(FlowNodeOutputTypeEnum).optional(),
  key: z.string(),
  valueType: z.nativeEnum(WorkflowIOValueTypeEnum),
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional()
});

export type OutputType = z.infer<typeof OutputSchema>;

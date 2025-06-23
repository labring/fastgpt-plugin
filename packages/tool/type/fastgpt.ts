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
  dynamic = 'dynamic'
}

export type InputConfigType = Omit<InputType, 'renderTypeList' | 'inputList'> & {
  inputType: 'string' | 'secret';
};

export type InputType = {
  referencePlaceholder?: string;
  placeholder?: string; // input,textarea
  maxLength?: number; // input,textarea

  list?: { label: string; value: string }[]; // select

  markList?: { label: string; value: number }[]; // slider
  step?: number; // slider
  max?: number; // slider, number input
  min?: number; // slider, number input

  defaultValue?: any;

  llmModelType?: `${LLMModelTypeEnum}`;

  // dynamic input
  customInputConfig?: CustomFieldConfigType;
  selectedTypeIndex?: number;
  renderTypeList: `${FlowNodeInputTypeEnum}`[]; // Node Type. Decide on a render style

  key: string;
  valueType?: `${WorkflowIOValueTypeEnum}`; // data type
  valueDesc?: string; // data desc
  value?: unknown;
  label: string;
  debugLabel?: string;
  description?: string; // field desc
  required?: boolean;
  enum?: string;

  toolDescription?: string; // If this field is not empty, it is entered as a tool

  // render components params
  canEdit?: boolean; // dynamic inputs
  isPro?: boolean; // Pro version field
  isToolOutput?: boolean;

  // file
  canSelectFile?: boolean;
  canSelectImg?: boolean;
  maxFiles?: number;

  inputList?: InputConfigType[];
};

export type OutputType = {
  id: string; // output unique id(Does not follow the key change)
  type: `${FlowNodeOutputTypeEnum}`;
  key: string;
  valueType?: `${WorkflowIOValueTypeEnum}`;
  valueDesc?: string;
  value?: unknown;

  label?: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
};

export type CustomFieldConfigType = {
  // reference
  selectValueTypeList?: `${WorkflowIOValueTypeEnum}`[]; // 可以选哪个数据类型, 只有1个的话,则默认选择
  showDefaultValue?: boolean;
  showDescription?: boolean;
};

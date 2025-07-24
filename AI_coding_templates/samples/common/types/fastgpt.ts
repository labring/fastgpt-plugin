/**
 * FastGPT 相关类型定义
 * 用于替代 @tool/type/fastgpt 包中的类型定义
 */

// 流程节点输入类型枚举
export enum FlowNodeInputTypeEnum {
  SYSTEM_INPUT = 'systemInput',
  REFERENCE = 'reference',
  CUSTOM = 'custom',
  DYNAMIC = 'dynamic',
  INPUT = 'input',
  NUMBER_INPUT = 'numberInput',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  SWITCH = 'switch',
  SLIDER = 'slider',
  FILE = 'file',
  SECRET = 'secret'
}

// 流程节点输出类型枚举
export enum FlowNodeOutputTypeEnum {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  HIDDEN = 'hidden'
}

// 系统输入键枚举
export enum SystemInputKeyEnum {
  // 用户相关
  USER_ID = 'userId',
  USER_NAME = 'userName',
  USER_AVATAR = 'userAvatar',

  // 对话相关
  CHAT_ID = 'chatId',
  CHAT_HISTORY = 'chatHistory',
  USER_QUESTION = 'userQuestion',

  // 应用相关
  APP_ID = 'appId',
  APP_NAME = 'appName',

  // 团队相关
  TEAM_ID = 'teamId',
  TEAM_NAME = 'teamName',

  // 环境相关
  ENVIRONMENT = 'environment',
  TIMESTAMP = 'timestamp',

  // 变量相关
  VARIABLES = 'variables',
  CONTEXT = 'context'
}

// 工作流IO值类型枚举
export enum WorkflowIOValueTypeEnum {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  FILE = 'file',
  CHAT_HISTORY = 'chatHistory',
  DATASET_QUOTE = 'datasetQuote',
  DYNAMIC = 'dynamic',
  ANY = 'any'
}

// 流程节点类型枚举
export enum FlowNodeTypeEnum {
  // 输入节点
  USER_GUIDE = 'userGuide',
  QUESTION_INPUT = 'questionInput',
  HISTORY = 'history',

  // 处理节点
  CHAT_NODE = 'chatNode',
  DATASET_SEARCH = 'datasetSearch',
  DATASET_CONCAT = 'datasetConcat',
  ANSWER = 'answer',
  CLASSIFY = 'classify',
  CONTENT_EXTRACT = 'contentExtract',
  HTTP_REQUEST = 'httpRequest',
  RUN_CODE = 'runCode',
  PLUGIN = 'plugin',

  // 逻辑节点
  IF_ELSE = 'ifElse',
  VARIABLE_UPDATE = 'variableUpdate',
  CODE = 'code',

  // 输出节点
  ANSWER_NODE = 'answerNode'
}

// 流程节点输入配置
export interface FlowNodeInputConfig {
  key: string;
  type: FlowNodeInputTypeEnum;
  valueType: WorkflowIOValueTypeEnum;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  list?: Array<{ label: string; value: any }>;
  max?: number;
  min?: number;
  step?: number;
  markList?: Array<{ label: string; value: any }>;
  connected?: boolean;
  showTargetInApp?: boolean;
  showTargetInPlugin?: boolean;
  hideInApp?: boolean;
  hideInPlugin?: boolean;
  canEdit?: boolean;
  editField?: {
    key: string;
    name: string;
    description?: string;
    inputType?: string;
    required?: boolean;
    placeholder?: string;
    list?: Array<{ label: string; value: any }>;
  };
}

// 流程节点输出配置
export interface FlowNodeOutputConfig {
  key: string;
  type: FlowNodeOutputTypeEnum;
  valueType: WorkflowIOValueTypeEnum;
  label: string;
  description?: string;
  targets?: Array<{
    moduleId: string;
    key: string;
  }>;
}

// 流程节点配置
export interface FlowNodeConfig {
  moduleId: string;
  name: string;
  avatar?: string;
  flowType: FlowNodeTypeEnum;
  showStatus?: boolean;
  position: {
    x: number;
    y: number;
  };
  inputs: FlowNodeInputConfig[];
  outputs: FlowNodeOutputConfig[];
}

// 工作流配置
export interface WorkflowConfig {
  nodes: FlowNodeConfig[];
  edges: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  chatConfig?: {
    welcomeText?: string;
    variables?: Record<string, any>;
    questionGuide?: boolean;
    ttsConfig?: any;
    whisperConfig?: any;
    scheduledTriggerConfig?: any;
  };
}

// 数据集引用
export interface DatasetQuote {
  id: string;
  datasetId: string;
  collectionId: string;
  sourceName: string;
  sourceId?: string;
  q: string;
  a: string;
  chunkIndex?: number;
  indexes?: Array<{
    defaultIndex?: any;
    dataId: string;
    text: string;
  }>;
}

// 聊天历史项
export interface ChatHistoryItem {
  obj: 'Human' | 'AI' | 'System';
  value: string;
  dataId?: string;
  time?: string;
}

// 聊天历史
export type ChatHistory = ChatHistoryItem[];

// 运行时变量
export interface RuntimeVariable {
  id: string;
  key: string;
  label: string;
  type: WorkflowIOValueTypeEnum;
  required: boolean;
  maxLen?: number;
  enums?: Array<{ value: string }>;
}

// 应用配置
export interface AppConfig {
  userGuide: {
    welcomeText: string;
    variables: RuntimeVariable[];
    questionGuide: boolean;
    ttsConfig: any;
    whisperConfig: any;
    scheduledTriggerConfig: any;
  };
  chatConfig: {
    relatedKbs: string[];
    searchMode: string;
    useGenerativeModel: boolean;
    queryExtensionModel?: string;
    ifOpenQuoteDialog: boolean;
  };
}

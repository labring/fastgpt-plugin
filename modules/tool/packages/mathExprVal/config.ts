import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.scientific],
  name: {
    'zh-CN': '数学公式执行',
    en: 'Mathematical Expression Execution'
  },
  description: {
    'zh-CN': '用于执行数学表达式的工具，通过 js 的 expr-eval 库运行表达式并返回结果。',
    en: 'A tool for executing mathematical expressions using the expr-eval library in js to return the result.'
  },
  icon: 'core/workflow/template/mathCall',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'expr',
          label: '数学表达式',
          description: '需要执行的数学表达式',
          required: true,
          toolDescription: '需要执行的数学表达式'
        }
      ],
      outputs: [
        {
          description: '返回的数学表达式结果',
          key: 'result',
          valueType: WorkflowIOValueTypeEnum.string,
          label: 'result'
        }
      ]
    }
  ]
});

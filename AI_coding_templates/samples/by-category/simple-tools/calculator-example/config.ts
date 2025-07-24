import { defineTool, ToolTypeEnum } from '../../../common/types/tool';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '../../../common/types/fastgpt';

export default defineTool({
  id: 'calculator-example',
  name: '数学计算器',
  type: ToolTypeEnum.SIMPLE,
  description: '强大的数学计算工具，支持基础运算和高级数学函数',
  avatar: '🧮',
  author: 'FastGPT',
  version: '1.0.0',
  updateTime: '2024-01-01',
  versionList: [
    {
      version: '1.0.0',
      updateTime: '2024-01-01',
      description: '初始版本，支持基础和高级数学函数',
      inputs: [
        {
          key: 'expression',
          label: '数学表达式',
          description: '要计算的数学表达式，支持基础运算和函数',
          type: 'string',
          required: true,
          placeholder: '例如: 2 + 3 * 4, sin(30), sqrt(16)'
        },
        {
          key: 'precision',
          label: '小数精度',
          description: '结果保留的小数位数（0-15）',
          type: 'number',
          defaultValue: 6,
          required: false,
          min: 0,
          max: 15
        },
        {
          key: 'angleUnit',
          label: '角度单位',
          description: '三角函数的角度单位',
          type: 'select',
          options: [
            { label: '度（Degree）', value: 'degree' },
            { label: '弧度（Radian）', value: 'radian' }
          ],
          defaultValue: 'degree',
          required: false
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '计算结果',
          description: '数学表达式的计算结果',
          type: 'string'
        },
        {
          key: 'numericResult',
          label: '数值结果',
          description: '计算结果的数值形式',
          type: 'number'
        },
        {
          key: 'metadata',
          label: '计算信息',
          description: '计算过程的详细信息',
          type: 'object'
        }
      ]
    }
  ],
  handler: './src/index'
});

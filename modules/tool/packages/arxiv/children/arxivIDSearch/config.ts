import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.search],
  name: {
    'zh-CN': 'ArXiv ID 论文检索',
    en: 'ArXiv ID Paper Search'
  },
  description: {
    'zh-CN': '通过 ArXiv ID 精确查找特定论文的详细信息',
    en: 'Search specific ArXiv paper by its ID to get detailed information'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'arxivId',
          label: 'ArXiv ID',
          description: '要查找的论文 ArXiv ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription:
            '要查找的论文 ArXiv ID，例如: "2301.00001", "arXiv:2301.00001", "cs-LG/0001001" 等'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'paper',
          label: '论文信息',
          description: '查找到的论文详细信息，包含标题、作者、摘要、链接等，如果未找到则为空'
        }
      ]
    }
  ]
});

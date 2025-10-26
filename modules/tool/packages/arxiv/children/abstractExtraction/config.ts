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
    'zh-CN': 'ArXiv 摘要提取',
    en: 'ArXiv Abstract Extraction'
  },
  description: {
    'zh-CN': '通过 ArXiv ID 提取论文摘要信息，包括标题、作者、摘要内容等',
    en: 'Extract paper abstract information by ArXiv ID, including title, authors, abstract content, etc.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'arxivId',
          label: 'ArXiv ID',
          description: '要提取摘要的论文 ArXiv ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription:
            '要提取摘要的论文 ArXiv ID，例如: "2301.00001", "arXiv:2301.00001", "1706.03762" 等'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'abstract',
          label: '摘要信息',
          description:
            '提取的论文摘要信息，包含标题、作者、摘要内容、发布时间、链接等，如果未找到则为空'
        }
      ]
    }
  ]
});

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
    'zh-CN': 'ArXiv 元数据提取',
    en: 'ArXiv Metadata Extraction'
  },
  description: {
    'zh-CN': '通过 ArXiv ID 提取论文完整元数据，包括标题、作者、分类、PDF下载链接等详细信息',
    en: 'Extract complete paper metadata by ArXiv ID, including title, authors, categories, PDF download links and other detailed information'
  },
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'arxivId',
          label: 'ArXiv ID',
          description: '要提取元数据的论文 ArXiv ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription:
            '要提取元数据的论文 ArXiv ID，例如: "2301.00001", "arXiv:2301.00001", "1706.03762" 等'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'metadata',
          label: '论文元数据',
          description:
            '提取的论文完整元数据，包含标题、作者、摘要、分类、版本、DOI、PDF下载链接等详细信息，如果未找到则为空'
        }
      ]
    }
  ]
});

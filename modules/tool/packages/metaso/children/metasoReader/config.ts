import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  SystemInputKeyEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'Metaso 网页读取',
    en: 'Metaso Web Reader'
  },
  description: {
    'zh-CN': '基于 Metaso API 的智能网页内容读取工具，提取网页文本内容',
    en: 'Intelligent web content reading tool powered by Metaso API for extracting web page text content'
  },
  courseUrl: 'https://metaso.cn',
  author: 'FastGPT',
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version with web content reading functionality',
      inputs: [
        {
          key: 'url',
          label: '网页URL',
          description: '要读取内容的网页URL地址',
          toolDescription: '网页URL地址',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        },
        {
          key: 'includeMetadata',
          label: '包含元数据',
          description: '是否在结果中包含网页标题等元数据信息',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          defaultValue: true,
          toolDescription: '是否包含网页元数据'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '网页内容',
          description: `Metaso 网页读取返回的结构化数据，包含网页文本内容和可选的元数据信息`,
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});

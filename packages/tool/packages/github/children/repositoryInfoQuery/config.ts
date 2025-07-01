import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'GitHub 仓库信息查询',
    en: 'GitHub Repository Info Query'
  },
  description: {
    'zh-CN':
      '查询任意公开仓库的基本信息（star数、fork数、描述、语言等）、README内容和license信息。可选GitHub Token以提升速率或访问私有仓库。',
    en: 'Query any public repository for basic info (stars, forks, description, language, etc.), README content, and license info. Optional GitHub token for higher rate limit or private repos.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'system_input_config',
          label: '',
          inputList: [
            {
              key: 'token',
              label: 'GitHub Token',
              description: '可选，填写后可提升API速率或访问私有仓库',
              inputType: 'secret',
              required: false
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'owner',
          label: '仓库拥有者',
          description: 'GitHub 仓库的拥有者用户名，如 facebook',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'repo',
          label: '仓库名',
          description: 'GitHub 仓库名，如 react',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'info',
          label: '仓库基本信息',
          description: '包含star数、fork数、描述、语言、topics等'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'readme',
          label: 'README内容',
          description: '仓库README的markdown原文内容'
        },
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'license',
          label: 'License信息',
          description: '仓库的license信息，如MIT、Apache-2.0等'
        }
      ]
    }
  ]
});

import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '新增智能表',
    en: 'Create Smart Sheet'
  },
  description: {
    'zh-CN': '管理企微智能表文档，支持新建智能表。',
    en: 'Manage WeCom Smart Sheet documents, supporting the creation of new smart sheets.'
  },
  toolDescription: 'Create a new WeCom Smart Sheet document.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'accessToken',
          label: '调用凭证 (access_token)',
          description: '企业微信的调用凭证',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The access token for WeCom API'
        },
        {
          key: 'doc_name',
          label: '文档名称',
          description: '要新建的文档名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The name of the document to create'
        },
        {
          key: 'spaceid',
          label: '空间 ID (spaceid)',
          description: '可选，指定存储的空间 ID',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Optional space ID where the document will be created'
        },
        {
          key: 'fatherid',
          label: '父目录 ID (fatherid)',
          description: '可选，父目录 fileid，根目录时为空间 spaceid',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Optional father directory ID'
        },
        {
          key: 'admin_users',
          label: '管理员列表',
          description: '可选，文档管理员的 userid 列表，多个用逗号隔开',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription:
            'Optional list of user IDs for document administrators, separated by commas'
        }
      ],
      outputs: [
        {
          key: 'docid',
          label: '文档 ID',
          description: '新建文档的唯一标识',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'url',
          label: '文档链接',
          description: '新建文档的访问链接',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});

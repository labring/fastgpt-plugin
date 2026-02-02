import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取草稿箱文章列表',
    en: 'Get Draft List'
  },
  description: {
    'zh-CN': '获取微信公众号草稿箱中的文章列表，支持分页查询',
    en: 'Get the list of draft articles in WeChat Official Account draft box with pagination support'
  },
  toolDescription:
    '获取微信公众号草稿箱中的文章列表。支持分页查询，可设置偏移量和每页数量。返回的草稿信息包括标题、作者、摘要、封面图等基本信息，可选择是否返回完整的文章内容。',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'accessToken',
          label: '访问令牌',
          description: '微信公众号 API 访问令牌（可选，与 appId/secret 二选一）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'appId',
          label: 'AppID',
          description: '微信公众号 AppID（与 secret 配合使用，或使用 accessToken）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'secret',
          label: 'AppSecret',
          description: '微信公众号 AppSecret（与 appId 配合使用，或使用 accessToken）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'offset',
          label: '偏移量',
          description: '从全部素材的该偏移位置开始返回，0 表示从第一个素材返回，默认为 0',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: false,
          toolDescription: 'offset for pagination, 0 means start from the first item'
        },
        {
          key: 'count',
          label: '返回数量',
          description: '返回素材的数量，取值范围在 1 到 20 之间，默认为 20',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: false,
          toolDescription: 'number of items to return, between 1 and 20'
        },
        {
          key: 'noContent',
          label: '不返回内容',
          description: '是否不返回文章内容字段，1 表示不返回，0 表示返回，默认为 0',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: false,
          toolDescription: '1 means no content field returned, 0 means content field returned'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'total_count',
          label: '草稿总数',
          description: '草稿箱中的草稿总数量'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'item_count',
          label: '本次返回数量',
          description: '本次返回的草稿数量'
        },
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'item',
          label: '草稿列表',
          description: '草稿文章列表数组，每个元素包含 media_id 和文章信息'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error_message',
          label: '错误信息',
          description: '处理过程中的错误信息'
        }
      ]
    }
  ]
});

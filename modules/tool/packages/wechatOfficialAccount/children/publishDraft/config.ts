import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '发布微信公众号草稿',
    en: 'Publish WeChat Official Account Draft'
  },
  description: {
    'zh-CN': '发布已创建的微信公众号草稿到公众号',
    en: 'Publish created WeChat Official Account draft to the official account'
  },
  toolDescription:
    '将指定的草稿media_id发布到微信公众号，支持使用access_token或appId/appSecret进行认证。发布成功后返回publish_id和msg_data_id，可用于后续的状态查询。',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'accessToken',
          label: '访问令牌',
          description: '微信公众号 API 访问令牌（可选，与 appId/appSecret 二选一）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'mediaId',
          label: '草稿媒体ID',
          description: '要发布的草稿media_id（从创建草稿或获取草稿列表中获得）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'Draft media_id to be published'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'publishId',
          label: '发布任务ID',
          description: '发布任务ID，可用于查询发布状态'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'msgDataId',
          label: '消息数据ID',
          description: '消息数据ID，用于标识发布的消息'
        }
      ]
    }
  ]
});

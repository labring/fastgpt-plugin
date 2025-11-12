import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '上传 Markdown 到草稿箱',
    en: 'Upload Markdown to Draft'
  },
  description: {
    'zh-CN': '将 Markdown 格式的内容转换为图文消息并上传到微信公众号草稿箱',
    en: 'Convert Markdown content to news article and upload to WeChat Official Account draft box'
  },
  toolDescription:
    '将 Markdown 内容转换为微信公众号图文消息格式，自动处理图片上传和封面图，然后保存到草稿箱。支持标题、作者、摘要等信息的自定义配置。',
  versionList: [
    {
      value: '0.1.0',
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
          key: 'markdownContent',
          label: 'Markdown 内容',
          description: '要转换的 Markdown 格式文章内容',
          renderTypeList: [
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.textarea
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: 'markdown format content',
          required: true
        },
        {
          key: 'coverImage',
          label: '封面图',
          description: '封面图片 URL 或 media_id，如果是 URL 将自动上传为永久素材',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'cover image url or media_id'
        },
        {
          key: 'title',
          label: '文章标题',
          description: '图文消息的标题，如果不填写将尝试从 Markdown 中提取',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'article title'
        },
        {
          key: 'author',
          label: '作者',
          description: '文章作者信息',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'article author'
        },
        {
          key: 'digest',
          label: '文章摘要',
          description: '文章摘要信息，如果不填写将自动从内容中提取',
          renderTypeList: [
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.textarea
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'article digest, optional, less than 120 characters'
        },
        {
          key: 'contentSourceUrl',
          label: '原文链接',
          description: '原文阅读链接地址',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'original article link'
        },
        {
          key: 'needOpenComment',
          label: '开启评论',
          description: '是否开启评论功能，0 表示关闭，1 表示开启',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: false
        },
        {
          key: 'onlyFansCanComment',
          label: '仅粉丝评论',
          description: '是否仅允许粉丝评论，0 表示所有人可评论，1 表示仅粉丝可评论',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: false
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'media_id',
          label: '素材ID',
          description: '草稿箱中图文消息的媒体标识符'
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

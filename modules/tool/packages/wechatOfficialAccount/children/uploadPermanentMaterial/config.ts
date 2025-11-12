import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '上传永久素材',
    en: 'Upload Permanent Material'
  },
  description: {
    'zh-CN': '上传永久素材到微信公众号，支持图片、语音、视频和缩略图等类型',
    en: 'Upload permanent materials to WeChat Official Account, supporting images, voice, video and thumbnails'
  },
  toolDescription:
    '上传永久素材到微信公众号素材库。支持图片、语音、视频和缩略图等类型。素材上传后会永久保存在公众号素材库中，可用于后续的图文消息和群发消息。支持文件路径、Base64编码和URL三种输入方式。',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'type',
          label: '素材类型',
          description: '要上传的素材类型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'Material type to upload',
          list: [
            { label: '图片', value: 'image' },
            { label: '语音', value: 'voice' },
            { label: '视频', value: 'video' }
          ]
        },
        {
          key: 'mediaUrl',
          label: '媒体文件 URL',
          description: '媒体文件的 URL 地址',
          renderTypeList: [
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.textarea
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'Media file content (Base64, file path or URL)'
        },
        {
          key: 'title',
          label: '素材标题',
          description: '素材标题，视频素材必填',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'Material title (required for video)'
        },
        {
          key: 'introduction',
          label: '素材简介',
          description: '素材简介，视频素材必填',
          renderTypeList: [
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.textarea
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'Material introduction (required for video)'
        },
        {
          key: 'accessToken',
          label: '访问令牌',
          description: '微信公众号访问令牌（可选，与 appId/appSecret 二选一）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          toolDescription: 'WeChat API access token (optional, alternative to appId/appSecret)'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'media_id',
          label: '媒体 ID',
          description: '上传成功后返回的媒体文件 ID'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: '文件 URL',
          description: '图片素材返回的 URL 地址'
        },
        {
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'success',
          label: '上传状态',
          description: '是否上传成功'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'message',
          label: '响应消息',
          description: '操作结果说明'
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

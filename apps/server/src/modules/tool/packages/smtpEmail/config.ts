import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.communication],
  name: {
    'zh-CN': 'Email 邮件发送',
    en: 'SMTP Email'
  },
  description: {
    'zh-CN': '通过SMTP协议发送电子邮件(nodemailer)',
    en: 'Send email by SMTP protocol (nodemailer)'
  },
  icon: 'plugins/email',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object,
          inputList: [
            {
              key: 'smtpHost',
              label: 'smtpHost',
              description: 'SMTP服务器地址',
              required: true,
              inputType: 'input'
            },
            {
              key: 'smtpPort',
              label: 'smtpPort',
              description: 'SMTP服务器端口',
              required: true,
              inputType: 'input'
            },
            {
              key: 'SSL',
              label: 'SSL',
              description: '是否使用SSL',
              required: true,
              inputType: 'switch'
            },
            {
              key: 'smtpUser',
              label: 'smtpUser',
              description: 'SMTP用户名, 邮箱账号',
              required: true,
              inputType: 'input'
            },
            {
              key: 'smtpPass',
              label: 'smtpPass',
              description: '邮箱密码或授权码',
              required: true,
              inputType: 'secret'
            }
          ]
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'fromName',
          label: 'fromName',
          description: '显示的发件人名称',
          required: true
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'to',
          label: 'to',
          description: '请输入收件人邮箱，多个邮箱用逗号分隔',
          required: true,
          toolDescription: '请输入收件人邮箱，多个邮箱用逗号分隔'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'subject',
          label: 'subject',
          description: '请输入邮件主题',
          required: true,
          toolDescription: '请输入邮件主题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'content',
          label: 'content',
          description: '请输入邮件内容，支持HTML格式',
          required: true,
          toolDescription: '请输入邮件内容，支持HTML格式'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'cc',
          label: 'cc',
          description: '请输入抄送邮箱，多个邮箱用逗号分隔',
          required: false,
          toolDescription: '请输入抄送邮箱，多个邮箱用逗号分隔'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'bcc',
          label: 'bcc',
          description: '请输入密送邮箱，多个邮箱用逗号分隔',
          required: false,
          toolDescription: '请输入密送邮箱，多个邮箱用逗号分隔'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'attachments',
          label: 'attachments',
          description: '必须是json数组格式\n[{"filename":"附件名","path":"附件url"}]',
          required: false,
          toolDescription: '必须是json数组格式\n[{"filename":"附件名","path":"附件url"}]'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '发送结果',
          description: '发送结果'
        }
      ]
    }
  ]
});

import { defineTool } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '企业微信日历管理',
    en: 'WeCom Calendar Manager'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '在一个工具中管理企业微信日历：支持创建、更新、删除和获取日历详情。',
    en: 'Manage WeCom calendars in one tool: supports creating, updating, deleting, and getting calendar details.'
  },
  toolDescription: `企业微信日历管理工具，支持以下 4 种操作：
1. create: 创建日历。必填项：summary (标题), color (颜色)。
2. update: 修改日历。必填项：cal_id (日历ID), summary (标题), color (颜色)。
3. delete: 删除日历。必填项：cal_id (日历ID)。
4. get: 获取日历详情。必填项：cal_id (日历ID)。

注意：颜色请使用十六进制 RGB 格式，如 "#FF0000" 表示红色。

常见错误处理：
- 报错 90492 (admin not in member list)：如果设置了“管理员 (admins)”，则该管理员必须也在“共享成员 (shares)”列表中。`,
  author: 'LBP97541135',
  courseUrl: 'https://developer.work.weixin.qq.com/document/path/93702',
  versionList: [
    {
      value: '1.0.0',
      description: '初版发布：支持日历 CRUD',
      inputs: [
        {
          key: 'accessToken',
          label: 'Access Token',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '企业微信应用的 access_token'
        },
        {
          key: 'action',
          label: '操作类型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '请选择要执行的操作',
          toolDescription: '操作类型：create (创建), update (更新), delete (删除), get (获取)',
          list: [
            { label: '创建 (create)', value: 'create' },
            { label: '更新 (update)', value: 'update' },
            { label: '删除 (delete)', value: 'delete' },
            { label: '获取详情 (get)', value: 'get' }
          ]
        },
        {
          key: 'cal_id',
          label: '日历 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日历的唯一 ID。在【更新、删除、获取】操作时为必填项',
          toolDescription: '日历 ID。在更新、删除、获取时必填'
        },
        {
          key: 'summary',
          label: '日历标题',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日历标题（1~128 字符）。创建和更新时必填',
          toolDescription: '日历标题'
        },
        {
          key: 'color',
          label: '日历颜色',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日历颜色，RGB 十六进制格式，如 "#FF3030"。创建和更新时必填',
          toolDescription: '日历颜色 (HEX 格式，如 #FF0000)'
        },
        {
          key: 'description',
          label: '日历描述',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日历描述',
          toolDescription: '日历描述'
        },
        {
          key: 'shares',
          label: '共享成员 UserID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '共享成员 UserID 列表，逗号分隔',
          toolDescription: '共享成员 UserID 列表'
        },
        {
          key: 'admins',
          label: '管理员 UserID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日历管理员 UserID 列表，逗号分隔。注意：管理员必须在共享成员列表中',
          toolDescription: '管理员 UserID 列表'
        }
      ],
      outputs: [
        {
          key: 'cal_id',
          label: '日历 ID',
          valueType: WorkflowIOValueTypeEnum.string,
          description: '操作成功的日历 ID'
        },
        {
          key: 'result',
          label: 'API 原始结果',
          valueType: WorkflowIOValueTypeEnum.object,
          description: '企业微信 API 返回的原始数据'
        }
      ]
    }
  ]
});

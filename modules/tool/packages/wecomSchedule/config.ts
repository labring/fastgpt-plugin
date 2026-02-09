import { defineTool } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '企业微信日程管理',
    en: 'WeCom Schedule Manager'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '在一个工具中管理企业微信日程：支持创建、更新、删除和获取日程详情。',
    en: 'Manage WeCom schedules in one tool: supports creating, updating, deleting, and getting schedule details.'
  },
  toolDescription: `企业微信日程管理工具，支持以下 4 种操作：
1. create: 创建日程。必填项：start_time, end_time。建议填写：summary。
2. update: 修改日程。必填项：schedule_id。可选：summary, start_time, end_time 等。
3. delete: 删除/取消日程。必填项：schedule_id。
4. get: 获取日程详情。必填项：schedule_id。

注意：时间格式必须为 YYYY-MM-DD HH:mm:ss。参与人 ID 请使用逗号分隔。

常见错误处理：
- 报错 90492 (admin not in member list)：如果设置了“管理员 (admins)”，则该管理员必须也在“参与人 (attendees)”列表中。`,
  author: 'LBP97541135',
  courseUrl: 'https://developer.work.weixin.qq.com/document/path/93648',
  versionList: [
    {
      value: '1.0.1',
      description: '优化参数必填说明与字段描述',
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
          key: 'schedule_id',
          label: '日程 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程的唯一 ID。在【更新、删除、获取】操作时为必填项',
          toolDescription: '日程的唯一 ID。在更新、删除、获取时必填'
        },
        {
          key: 'summary',
          label: '日程标题',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程标题，建议创建时填写（最多 128 字符）',
          toolDescription: '日程标题'
        },
        {
          key: 'start_time',
          label: '开始时间',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '格式：YYYY-MM-DD HH:mm:ss。创建日程时为必填项',
          toolDescription: '开始时间，格式：YYYY-MM-DD HH:mm:ss'
        },
        {
          key: 'end_time',
          label: '结束时间',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '格式：YYYY-MM-DD HH:mm:ss。创建日程时为必填项',
          toolDescription: '结束时间，格式：YYYY-MM-DD HH:mm:ss'
        },
        {
          key: 'attendees',
          label: '参与人 UserID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '多个 UserID 请用英文逗号分隔',
          toolDescription: '参与人 UserID 列表，逗号分隔'
        },
        {
          key: 'cal_id',
          label: '日历 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程所属的日历 ID。不填则为默认日历',
          toolDescription: '所属日历 ID'
        },
        {
          key: 'admins',
          label: '管理员 UserID',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程管理员 UserID 列表，逗号分隔。注意：管理员必须在参与人列表中',
          toolDescription: '管理员 UserID 列表'
        },
        {
          key: 'remind_before',
          label: '提醒时间',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '设置日程开始前的提醒时间',
          toolDescription: '提前提醒时间（秒）',
          list: [
            { label: '不提醒', value: 'undefined' },
            { label: '事件开始时', value: '0' },
            { label: '5 分钟前', value: '300' },
            { label: '15 分钟前', value: '900' },
            { label: '1 小时前', value: '3600' },
            { label: '1 天前', value: '86400' }
          ]
        },
        {
          key: 'location',
          label: '日程地点',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程发生的地点（最多 128 字符）',
          toolDescription: '日程地点'
        },
        {
          key: 'description',
          label: '日程描述',
          renderTypeList: [FlowNodeInputTypeEnum.textarea],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: '日程的详细备注信息（最多 512 字符）',
          toolDescription: '日程描述'
        },
        {
          key: 'is_whole_day',
          label: '是否全天',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否为全天日程',
          defaultValue: false,
          toolDescription: '是否为全天日程'
        }
      ],
      outputs: [
        {
          key: 'schedule_id',
          label: '日程ID',
          valueType: WorkflowIOValueTypeEnum.string,
          description: '操作成功的日程ID'
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

import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  name: {
    'zh-CN': '博查搜索',
    en: 'Bocha Search'
  },
  icon: 'core/workflow/template/bocha',
  type: ToolTypeEnum.search,
  description: {
    'zh-CN': '使用博查AI搜索引擎进行网络搜索。',
    en: 'Use Bocha AI search engine for web search.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
          {
            key: 'apiKey',
            label: '博查API密钥',
            description: '博查API密钥',
            required: true,
            inputType: 'secret'
          }
        ]),
        {
          key: 'query',
          label: '搜索查询词',
          description: '搜索查询词',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'freshness',
          label: '时间范围',
          description: '搜索指定时间范围内的网页。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            {
              label: '不限制',
              value: 'noLimit'
            },
            {
              label: '一天内',
              value: 'oneDay'
            },
            {
              label: '一周内',
              value: 'oneWeek'
            },
            {
              label: '一个月内',
              value: 'oneMonth'
            },
            {
              label: '一年内',
              value: 'oneYear'
            }
          ]
        },
        {
          key: 'summary',
          label: '显示摘要',
          description: '是否显示文本摘要。',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'include',
          label: '包含网站',
          description: '指定搜索的site范围。多个域名使用|或,分隔，最多20个。例如：qq.com|m.163.com',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'exclude',
          label: '排除网站',
          description: '排除搜索的网站范围。多个域名使用|或,分隔，最多20个。例如：qq.com|m.163.com',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'count',
          label: '结果数量',
          description: '返回结果的条数。可填范围：1-50，默认为10',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 1,
          max: 50
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '搜索结果',
          description: '搜索返回的结果列表'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ]
});

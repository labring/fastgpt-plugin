import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': 'SEO关键词挖掘工具',
    en: 'SEO Keyword Miner'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '基于5118 API的海量长尾关键词挖掘工具，获取关键词搜索量和指数数据',
    en: 'Massive long-tail keyword mining tool based on 5118 API,获取 keyword search volume and index data'
  },
  toolDescription:
    'A powerful SEO tool for mining long-tail keywords using 5118 API. Provides search volume data and keyword metrics for SEO optimization.',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: '5118 API Key',
      description:
        '在 5118 控制台获取 API Key。文档：https://www.5118.com/apistore/detail/8cf3d6ed-2b12-ed11-8da8-e43d1a103141/-1',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '1.0.0',
      description: '5118 SEO关键词挖掘',
      inputs: [
        {
          key: 'keyword',
          label: '种子关键词',
          description: '输入要挖掘的关键词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          placeholder: '请输入关键词',
          toolDescription: '输入要挖掘的关键词'
        },
        {
          key: 'pageIndex',
          label: '页码',
          description: '当前分页，默认第1页',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          placeholder: '请输入页码',
          toolDescription: '当前分页，默认第1页'
        },
        {
          key: 'pageSize',
          label: '每页数量',
          description: '每页返回数据的数量，最大100条，默认100条',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          placeholder: '请输入每页数量',
          toolDescription: '每页返回数据的数量，最大100条，默认100条'
        },
        {
          key: 'sortFields',
          label: '排序字段',
          description:
            '排序字段(2:竞价公司数量,3:长尾词数量,4:流量指数,5:百度移动指数,6:360好搜指数,7:PC日检索量,8:移动日检索量,9:竞争激烈程度)',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          placeholder: '请输入排序字段',
          toolDescription:
            '排序字段(2:竞价公司数量,3:长尾词数量,4:流量指数,5:百度移动指数,6:360好搜指数,7:PC日检索量,8:移动日检索量,9:竞争激烈程度)',
          list: [
            {
              label: '竞价公司数量',
              value: '2'
            },
            {
              label: '长尾词数量',
              value: '3'
            },
            {
              label: '流量指数',
              value: '4'
            },
            {
              label: '百度移动指数',
              value: '5'
            },
            {
              label: '360好搜指数',
              value: '6'
            },
            {
              label: 'PC日检索量',
              value: '7'
            },
            {
              label: '移动日检索量',
              value: '8'
            },
            {
              label: '竞争激烈程度',
              value: '9'
            }
          ]
        },
        {
          key: 'sortType',
          label: '排序方式',
          description: '升序或降序(asc:升序,desc:降序)',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '请输入排序方式',
          toolDescription: '升序或降序(asc:升序,desc:降序)',
          list: [
            {
              label: '升序',
              value: 'asc'
            },
            {
              label: '降序',
              value: 'desc'
            }
          ]
        },
        {
          key: 'filter',
          label: '快捷过滤',
          description:
            '过滤条件(1:所有词,2:所有流量词,3:流量指数词,4:移动指数词,5:360指数词,6:流量特点词,7:PC日检索量词,8:移动日检索量,9:存在竞价的词)',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          placeholder: '请输入快捷过滤',
          toolDescription:
            '过滤条件(1:所有词,2:所有流量词,3:流量指数词,4:移动指数词,5:360指数词,6:流量特点词,7:PC日检索量词,8:移动日检索量,9:存在竞价的词)',
          list: [
            {
              label: '所有词',
              value: '1'
            },
            {
              label: '所有流量词',
              value: '2'
            },
            {
              label: '流量指数词',
              value: '3'
            },
            {
              label: '移动指数词',
              value: '4'
            },
            {
              label: '360指数词',
              value: '5'
            },
            {
              label: '流量特点词',
              value: '6'
            },
            {
              label: 'PC日检索量词',
              value: '7'
            },
            {
              label: '移动日检索量',
              value: '8'
            },
            {
              label: '存在竞价的词',
              value: '9'
            }
          ]
        },
        {
          key: 'filterDate',
          label: '筛选日期',
          description: '筛选日期(格式:yyyy-MM-dd)，可选',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '请输入筛选日期',
          toolDescription: '筛选日期(格式:yyyy-MM-dd)，可选'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'keywords',
          label: '关键词列表',
          description: '挖掘到的相关关键词及其数据（JSON格式）'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'total',
          label: '总数量',
          description: '找到的关键词总数'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'pageCount',
          label: '总页数',
          description: '分页的总页数'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'pageIndex',
          label: '当前页码',
          description: '当前返回的页码'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'pageSize',
          label: '每页数量',
          description: '每页返回的关键词数量'
        }
      ]
    }
  ]
});

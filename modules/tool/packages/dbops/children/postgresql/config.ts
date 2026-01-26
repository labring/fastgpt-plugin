import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  isWorkerRun: false,
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': 'PostgreSQL',
    en: 'PostgreSQL'
  },
  description: {
    'zh-CN': '基于 PostgreSQL 数据库的智能数据库连接工具，支持多种格式输出',
    en: 'Intelligent database connection tool powered by PostgreSQL with multiple output formats'
  },
  courseUrl: 'https://www.postgresql.org/',
  secretInputConfig: [
    {
      key: 'host',
      label: '主机名',
      required: true,
      inputType: 'input'
    },
    {
      key: 'port',
      label: '数据库连接端口号',
      required: true,
      inputType: 'numberInput'
    },
    {
      key: 'username',
      label: '数据库账号',
      required: true,
      inputType: 'input'
    },
    {
      key: 'password',
      label: '数据库密码',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'database',
      label: '数据库名称',
      required: false,
      inputType: 'input'
    },
    {
      key: 'maxConnections',
      label: '最大连接数',
      required: false,
      inputType: 'numberInput'
    },
    {
      key: 'connectionTimeout',
      label: '连接超时时间',
      required: false,
      inputType: 'numberInput'
    }
  ],
  versionList: [
    {
      value: '0.1.1',
      description: 'Provide the ability to connect to PostgreSQL database',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'sql',
          label: 'SQL',
          description: 'SQL 语句，可以传入 SQL 语句直接执行',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          required: true,
          toolDescription: 'SQL 语句，可以传入 SQL 语句直接执行'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '执行结果',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});

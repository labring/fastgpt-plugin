import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': 'Microsoft SQL Server',
    en: 'Microsoft SQL Server'
  },
  description: {
    'zh-CN': '基于 Microsoft SQL Server 数据库的智能数据库连接工具，支持多种格式输出',
    en: 'Intelligent database connection tool powered by Microsoft SQL Server with multiple output formats'
  },
  courseUrl: 'https://learn.microsoft.com/en-us/sql/sql-server/?view=sql-server-ver17',
  secretInputConfig: [
    {
      key: 'database',
      label: '数据库名称',
      required: true,
      inputType: 'input'
    },
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
    },
    {
      key: 'domain',
      label: '域名(Windows 身份认证时需要)',
      required: false,
      inputType: 'input'
    },
    {
      key: 'instanceName',
      label: '实例名称(Windows 身份认证时需要)',
      required: false,
      inputType: 'input'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Provide the ability to connect to Microsoft SQL Server database',
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

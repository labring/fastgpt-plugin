import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': '数据库连接',
    en: 'Database Connection'
  },
  description: {
    'zh-CN': '可连接常用数据库，并执行sql',
    en: 'Can connect to common databases and execute sql'
  },
  icon: 'core/workflow/template/datasource',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'sql',
          label: 'sql',
          description: 'sql语句，可以传入sql语句直接执行',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          required: true,
          toolDescription: 'sql语句，可以传入sql语句直接执行'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '执行结果',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    },
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'sql',
          label: 'sql',
          description: 'sql语句，可以传入sql语句直接执行',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          required: true,
          toolDescription: 'sql语句，可以传入sql语句直接执行'
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
  ],
  secretInputConfig: [
    {
      key: 'databaseType',
      label: '数据库类型',
      required: true,
      inputType: 'select',
      list: [
        {
          label: 'MySQL',
          value: 'MySQL'
        },
        {
          label: 'PostgreSQL',
          value: 'PostgreSQL'
        },
        {
          label: 'Microsoft SQL Server',
          value: 'Microsoft SQL Server'
        }
      ]
    },
    {
      key: 'host',
      label: 'host',
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
      key: 'databaseName',
      label: '数据库名称',
      required: true,
      inputType: 'input'
    },
    {
      key: 'user',
      label: '数据库账号',
      required: true,
      inputType: 'input'
    },
    {
      key: 'password',
      label: '数据库密码',
      required: true,
      inputType: 'secret'
    }
  ]
});

import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  toolId: 'community-databaseConnection',
  type: ToolTypeEnum.tools,
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
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'databaseType',
          label: 'databaseType',
          description: '数据库的类型',
          defaultValue: '',
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
          ],
          required: true
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'host',
          label: 'host',
          description: '数据库连接host',
          defaultValue: '',
          required: true,
          list: [
            {
              label: '',
              value: ''
            }
          ]
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'port',
          label: 'port',
          description: '数据库连接端口号',
          defaultValue: '',
          required: true,
          list: [
            {
              label: '',
              value: ''
            }
          ]
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'databaseName',
          label: 'databaseName',
          description: '数据库名称',
          defaultValue: '',
          required: true,
          list: [
            {
              label: '',
              value: ''
            }
          ]
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'password',
          label: 'password',
          description: '数据库密码',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          required: true
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'user',
          label: 'user',
          description: '数据库账号',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          required: true
        },
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
          id: 'result',
          type: FlowNodeOutputTypeEnum.static,
          key: 'result',
          label: '结果',
          description: '执行结果',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});

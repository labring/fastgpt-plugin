import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '新增多维表格',
    en: 'Create BiTable'
  },
  description: {
    'zh-CN': '创建一个新的飞书多维表格',
    en: 'Create a new Feishu Bitable'
  },
  toolDescription: 'Create a new Feishu Bitable application with specified name and folder token.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'name',
          label: '应用名称',
          description: '多维表格应用的名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The name of the Bitable application to create',
          maxLength: 100
        },
        {
          key: 'folderToken',
          label: '文件夹 Token',
          description: '创建应用的目标文件夹标识(可选)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        }
      ],
      outputs: [
        {
          key: 'id',
          label: '多维表格 ID',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'url',
          label: '多维表格链接',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});

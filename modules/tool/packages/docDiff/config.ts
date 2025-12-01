import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': '文档对比工具',
    en: 'DocDiff'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '对比两个 Markdown 文档的差异，生成可视化的 HTML 对比报告',
    en: 'Compare differences between two Markdown documents and generate visual HTML comparison report'
  },
  toolDescription:
    'A tool that compares two markdown documents and generates a visual HTML diff report showing differences section by section',

  versionList: [
    {
      value: '1.1.0',
      description: 'Fix version - Remove diff tags and add document titles support',
      inputs: [
        {
          key: 'originalText',
          label: '原始文档',
          description: '原始的 Markdown 格式文档内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The original markdown document content to compare'
        },
        {
          key: 'originalTitle',
          label: '原始文档标题',
          description: '原始文档的标题，将在对比界面中显示',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          defaultValue: '原始文档'
        },
        {
          key: 'modifiedText',
          label: '修改后文档',
          description: '修改后的 Markdown 格式文档内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The modified markdown document content to compare'
        },
        {
          key: 'modifiedTitle',
          label: '修改后文档标题',
          description: '修改后文档的标题，将在对比界面中显示',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          defaultValue: '修改后文档'
        },
        {
          key: 'title',
          label: '对比报告标题',
          description: '生成的 HTML 对比报告的标题',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          defaultValue: '文档对比报告'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'htmlUrl',
          label: 'HTML 对比报告连接',
          description: '生成的 HTML 对比报告的访问连接'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'diffs',
          label: '差异结果数组',
          description: '过滤后的文档差异数组，包含新增、删除、修改的变更'
        }
      ]
    },
    {
      value: '1.0.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'originalText',
          label: '原始文档',
          description: '原始的 Markdown 格式文档内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The original markdown document content to compare'
        },
        {
          key: 'modifiedText',
          label: '修改后文档',
          description: '修改后的 Markdown 格式文档内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The modified markdown document content to compare'
        },
        {
          key: 'title',
          label: '对比报告标题',
          description: '生成的 HTML 对比报告的标题',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          defaultValue: '文档对比报告'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'htmlUrl',
          label: 'HTML 对比报告连接',
          description: '生成的 HTML 对比报告的访问连接'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'diffs',
          label: '差异结果数组',
          description: '过滤后的文档差异数组，包含新增、删除、修改的变更'
        }
      ]
    }
  ]
});

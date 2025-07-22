import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  icon: 'core/workflow/template/httpRequest', // 使用HTTP请求图标，可以后续自定义
  courseUrl: '', // 可以添加使用教程链接
  type: ToolTypeEnum.search, // 定义为搜索类型工具
  name: {
    'zh-CN': '小X宝癌症患者助手',
    en: 'XiaoYiBao Cancer Patient Assistant'
  },
  description: {
    'zh-CN': '调用小X宝癌症患者助手API，为癌症患者提供专业的医疗咨询和建议',
    en: 'Call XiaoYiBao Cancer Patient Assistant API to provide professional medical consultation and advice for cancer patients'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
          {
            key: 'key',
            label: '小X宝 API Key',
            description: '可以在 https://admin.xiaoyibao.com.cn 获取API密钥',
            required: true,
            inputType: 'secret' // 敏感信息，使用密码输入框
          }
        ]),
        {
          key: 'query',
          label: '患者咨询问题',
          description: '患者的咨询问题，可以从工作流全局变量中获取',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.textarea],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '请输入或连接患者咨询问题'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '助手回复',
          description: '小X宝癌症患者助手的专业回复'
        }
      ]
    }
  ]
});

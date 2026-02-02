import { defineTool } from '@tool/type';
import { WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': '企业微信授权',
    en: 'WeChat Work Auth'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '获取企业微信授权 Token',
    en: 'Get WeChat Work authorization token'
  },
  toolDescription:
    'Get WeChat Work (WeCom) authorization token by corpId. Returns access_token and expires_in.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Get WeChat Work authorization token',
      inputs: [],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'access_token',
          label: '访问令牌',
          description: '企业微信访问令牌'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'expires_in',
          label: '过期时间（秒）',
          description: 'Token 过期时间（秒）'
        }
      ]
    }
  ]
});

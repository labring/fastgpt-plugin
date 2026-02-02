import { defineTool } from '@tool/type';
import { WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取微信公众号鉴权信息',
    en: 'Get WeChat Official Account Auth Token'
  },
  description: {
    'zh-CN': '通过 AppID 和 AppSecret 获取微信公众号的 access_token，用于后续 API 调用认证',
    en: 'Get WeChat Official Account access_token using AppID and AppSecret for subsequent API authentication'
  },
  toolDescription:
    '获取微信公众号的 access_token。需要提供微信公众号的 AppID 和 AppSecret。返回的 access_token 有效期为 7200 秒，请在过期前重新获取。',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'access_token',
          label: 'AccessToken',
          description: '微信公众号 API 访问令牌'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'expires_in',
          label: 'ExpiresIn',
          description: '微信公众号 API 访问令牌过期时间（秒）'
        }
      ]
    }
  ]
});

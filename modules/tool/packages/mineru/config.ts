import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'MinerU',
    en: 'MinerU'
  },
  author: 'gary-Shen',
  type: ToolTypeEnum.tools,
  courseUrl: 'https://mineru.net/',
  description: {
    'zh-CN': 'MinerU 是一款可以在本地部署的将文件转化为机器可读格式的工具（如 markdown、json ）。',
    en: 'MinerU is a tool that can convert FILES to machine-readable formats (such as markdown, json).'
  },
  secretInputConfig: [
    {
      key: 'base_url',
      label: 'MinerU Base url',
      description: 'Example: https://mineru.net, http://127.0.0.1:8000',
      inputType: 'input'
    },
    {
      key: 'token',
      label: 'API Token',
      description:
        '官方在线 MinerU 解析服务的 API Token，可在 https://mineru.net/apiManage/docs 申请获取',
      inputType: 'secret'
    }
  ]
});

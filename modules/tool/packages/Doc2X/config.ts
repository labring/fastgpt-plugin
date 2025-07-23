import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Doc2X 服务',
    en: 'Doc2X Service'
  },
  type: ToolTypeEnum.tools,
  courseUrl: 'https://doc2x.noedgeai.com?inviteCode=9EACN2',
  description: {
    'zh-CN': '将传入的图片或PDF文件发送至Doc2X进行解析，返回带LaTeX公式的markdown格式的文本。',
    en: 'Send an image or PDF file to Doc2X for parsing and return the LaTeX formula in markdown format.'
  },
  icon: 'plugins/doc2x',
  secretInputConfig: [
    {
      key: 'apikey',
      label: 'apikey',
      description: 'Doc2X的API密钥，可以从Doc2X开放平台获得',
      required: true,
      inputType: 'secret'
    }
  ]
});

import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    en: 'DataForB2B',
    'zh-CN': 'DataForB2B B2B 数据'
  },
  tags: [ToolTagEnum.enum.search, ToolTagEnum.enum.productivity],
  description: {
    en: 'B2B data API for lead generation and sales prospecting. Search people and companies across 70+ filters (job title, skills, company size, industry, seniority, funding stage, investor, past employers, certifications, years of experience, languages) and enrich profiles or companies to get verified work emails, personal emails and phone numbers — turn your FastGPT agent into a sales or recruiting research engine.',
    'zh-CN':
      '面向销售与招聘的 B2B 数据 API:基于 70+ 条件(职位、技能、公司规模、行业、资历、融资阶段、投资人、过往雇主等)搜索人物与公司,并对联系人/公司进行数据增强,获取经过验证的工作邮箱、个人邮箱与电话,为 FastGPT 智能体提供线索挖掘能力。'
  },
  toolDescription:
    'DataForB2B toolset for B2B lead generation: search people and companies with structured filters, run a natural-language reasoning search, resolve exact filter values with typeahead, and enrich a person or company (work/personal email, phone). Authenticate once with your DataForB2B API key.',
  courseUrl: 'https://docs.dataforb2b.ai',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'DataForB2B API Key',
      description: 'Get your API key from app.dataforb2b.ai (Settings > API Keys).',
      required: true,
      inputType: 'secret'
    }
  ]
});

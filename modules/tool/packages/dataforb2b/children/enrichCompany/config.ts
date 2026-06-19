import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '公司数据增强',
    en: 'Enrich Company'
  },
  description: {
    'zh-CN': '通过域名 / slug / 公司主页链接获取完整的公司档案数据。',
    en: 'Get full company data from a domain, slug or company page URL.'
  },
  toolDescription:
    'Enrich a company. Pass a company identifier (domain or slug like "google", a company page URL, or an encoded org_… id) and get the full company profile: industry, size, location, funding and more.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'company_identifier',
          label: 'Company identifier',
          description:
            'Company slug (e.g. "google"), domain, company page URL (LinkedIn supported), or encoded org_… id.',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Slug / domain / company page URL / org_ id of the company'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: 'Result',
          description: 'Enriched company data returned by the API.',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});

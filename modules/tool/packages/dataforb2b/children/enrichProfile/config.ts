import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'LinkedIn 人物数据增强',
    en: 'Enrich LinkedIn Profile'
  },
  description: {
    'zh-CN': '通过个人主页链接 / 公共 ID 获取完整人物档案、工作邮箱、个人邮箱与电话。',
    en: 'Get a full profile, work email, personal email and phone from a profile URL or public id.'
  },
  toolDescription:
    'Enrich a person. Pass a profile identifier (a profile URL, public id like "john-doe", or encoded prof_… id) and choose what to retrieve: full profile, work email, personal email, phone, GitHub. At least one flag must be enabled — defaults to full profile. Ideal for profile-to-email lead enrichment.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'profile_identifier',
          label: 'Profile identifier',
          description:
            'Profile URL (LinkedIn supported), public id (e.g. "john-doe"), or encoded prof_… id (recommended).',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Profile URL / public id / prof_ id of the person to enrich'
        },
        {
          key: 'enrich_profile',
          label: 'Full profile',
          description: 'Return the full professional profile.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'enrich_work_email',
          label: 'Work email',
          description: 'Find the professional / work email.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'enrich_personal_email',
          label: 'Personal email',
          description: 'Find the personal email.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'enrich_phone',
          label: 'Phone',
          description: 'Find the phone number.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'enrich_github',
          label: 'GitHub',
          description: 'Find the GitHub profile.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        }
      ],
      outputs: [
        {
          key: 'result',
          label: 'Result',
          description: 'Enriched profile data returned by the API.',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});

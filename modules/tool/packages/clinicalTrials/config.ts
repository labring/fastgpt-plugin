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
  icon: 'core/workflow/template/httpRequest', // 使用HTTP请求图标
  courseUrl: '', // 可以添加使用教程链接
  type: ToolTypeEnum.search, // 定义为搜索类型工具
  name: {
    'zh-CN': '临床试验查询',
    en: 'Clinical Trials Search'
  },
  description: {
    'zh-CN':
      '调用ClinicalTrials.gov官方API，查询全球临床试验信息，支持按疾病、阶段、状态、地区等条件筛选',
    en: 'Call ClinicalTrials.gov official API to search global clinical trial information with filters for disease, phase, status, location, etc.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'query',
          label: '疾病或关键词',
          description:
            '要查询的疾病名称或关键词，支持自然语言查询。如："请查询下中国的kras12d的胰腺癌II期临床试验最近30天有哪些在招募的方案"',
          required: true,
          renderTypeList: [
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.select,
            FlowNodeInputTypeEnum.input
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '支持自然语言查询，如：请查询中国的胰腺癌II期临床试验',
          list: [
            { label: '胰腺癌 / pancreatic cancer', value: 'pancreatic cancer' },
            { label: '乳腺癌 / breast cancer', value: 'breast cancer' },
            { label: '肺癌 / lung cancer', value: 'lung cancer' },
            { label: '肝癌 / liver cancer', value: 'liver cancer' },
            { label: '胃癌 / gastric cancer', value: 'gastric cancer' },
            { label: '结直肠癌 / colorectal cancer', value: 'colorectal cancer' },
            { label: '前列腺癌 / prostate cancer', value: 'prostate cancer' },
            { label: '卵巢癌 / ovarian cancer', value: 'ovarian cancer' },
            { label: '宫颈癌 / cervical cancer', value: 'cervical cancer' },
            { label: '白血病 / leukemia', value: 'leukemia' },
            { label: '淋巴瘤 / lymphoma', value: 'lymphoma' },
            { label: '黑色素瘤 / melanoma', value: 'melanoma' },
            { label: 'KRAS突变', value: 'KRAS mutation' },
            { label: 'PD-1/PD-L1抑制剂', value: 'PD-1 PD-L1 inhibitor' },
            { label: 'CAR-T细胞治疗', value: 'CAR-T cell therapy' }
          ]
        },
        {
          key: 'phases',
          label: '试验阶段',
          description: '选择感兴趣的试验阶段，可多选',
          required: false,
          renderTypeList: [
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.multipleSelect,
            FlowNodeInputTypeEnum.input
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '选择试验阶段',
          list: [
            { label: '早期I期 (Early Phase 1)', value: 'EARLY_PHASE1' },
            { label: 'I期 (Phase 1)', value: 'PHASE1' },
            { label: 'I/II期 (Phase 1/Phase 2)', value: 'PHASE1_PHASE2' },
            { label: 'II期 (Phase 2)', value: 'PHASE2' },
            { label: 'II/III期 (Phase 2/Phase 3)', value: 'PHASE2_PHASE3' },
            { label: 'III期 (Phase 3)', value: 'PHASE3' },
            { label: 'IV期 (Phase 4)', value: 'PHASE4' }
          ]
        },
        {
          key: 'status',
          label: '试验状态',
          description: '选择试验状态，可多选',
          required: false,
          renderTypeList: [
            FlowNodeInputTypeEnum.reference,
            FlowNodeInputTypeEnum.multipleSelect,
            FlowNodeInputTypeEnum.input
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '选择试验状态',
          list: [
            { label: '招募中 (Recruiting)', value: 'RECRUITING' },
            { label: '尚未开始招募 (Not yet recruiting)', value: 'NOT_YET_RECRUITING' },
            { label: '活跃但不招募 (Active, not recruiting)', value: 'ACTIVE_NOT_RECRUITING' },
            { label: '已完成 (Completed)', value: 'COMPLETED' },
            { label: '已终止 (Terminated)', value: 'TERMINATED' },
            { label: '已暂停 (Suspended)', value: 'SUSPENDED' },
            { label: '已撤回 (Withdrawn)', value: 'WITHDRAWN' },
            { label: '未知状态 (Unknown status)', value: 'UNKNOWN' }
          ]
        },
        {
          key: 'location',
          label: '地理位置',
          description: '筛选试验所在地区或国家',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '选择地区或国家',
          list: [
            { label: '中国 (China)', value: 'china' },
            { label: '美国 (United States)', value: 'united states' },
            { label: '日本 (Japan)', value: 'japan' },
            { label: '韩国 (Korea)', value: 'korea' },
            { label: '新加坡 (Singapore)', value: 'singapore' },
            { label: '澳大利亚 (Australia)', value: 'australia' },
            { label: '加拿大 (Canada)', value: 'canada' },
            { label: '英国 (United Kingdom)', value: 'united kingdom' },
            { label: '德国 (Germany)', value: 'germany' },
            { label: '法国 (France)', value: 'france' },
            { label: '意大利 (Italy)', value: 'italy' },
            { label: '西班牙 (Spain)', value: 'spain' },
            { label: '荷兰 (Netherlands)', value: 'netherlands' },
            { label: '瑞士 (Switzerland)', value: 'switzerland' },
            { label: '瑞典 (Sweden)', value: 'sweden' },
            { label: '丹麦 (Denmark)', value: 'denmark' },
            { label: '挪威 (Norway)', value: 'norway' },
            { label: '芬兰 (Finland)', value: 'finland' },
            { label: '比利时 (Belgium)', value: 'belgium' },
            { label: '奥地利 (Austria)', value: 'austria' },
            { label: '以色列 (Israel)', value: 'israel' },
            { label: '印度 (India)', value: 'india' },
            { label: '泰国 (Thailand)', value: 'thailand' }
          ]
        },
        {
          key: 'startDate',
          label: '开始日期',
          description: '查询此日期之后发布或更新的试验，格式：yyyy-mm-dd',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: 'yyyy-mm-dd 格式，如：2024-01-01'
        },
        {
          key: 'pageSize',
          label: '返回数量',
          description: '返回的试验数量，默认200，最大1000',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          placeholder: '默认200，最大1000',
          min: 1,
          max: 1000,
          defaultValue: 200
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '查询结果',
          description: '格式化的临床试验查询结果，包含试验详情、联系方式等信息'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'totalCount',
          label: '试验总数',
          description: '符合条件的试验总数量'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'summary',
          label: '查询摘要',
          description: '查询条件和结果的简要摘要'
        }
      ]
    }
  ]
});

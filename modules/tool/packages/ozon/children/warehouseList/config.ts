import { defineTool } from '@tool/type';
import { WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '仓库清单',
    en: 'Warehouse List'
  },
  description: {
    'zh-CN': '方法返回 FBS 和 rFBS 仓库列表。获取 FBO 仓库请使用 /v1/cluster/list。',
    en: 'Returns the list of FBS and rFBS warehouses. Use /v1/cluster/list for FBO.'
  },
  toolDescription: 'List FBS and rFBS warehouses via /v1/warehouse/list.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '仓库清单',
          description: '仓库列表（包含名称、ID、状态、工作日等）'
        }
      ]
    }
  ]
});

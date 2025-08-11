import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '复杂图表测试',
    en: 'complexChart'
  },
  description: {
    'zh-CN':
      '用于测试复杂的ECharts图表功能，支持多系列数据、组合图表、地图、雷达图、热力图等复杂图表类型',
    en: 'For testing complex ECharts functionality, supports multi-series data, combination charts, maps, radar charts, heatmaps and other complex chart types'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '图表标题',
          description: '图表标题',
          toolDescription: '图表标题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartType',
          label: '图表类型',
          description: '选择要生成的图表类型',
          required: true,
          list: [
            {
              label: '多系列折线图',
              value: 'multiLine'
            },
            {
              label: '混合图表(柱状+折线)',
              value: 'mixed'
            },
            {
              label: '堆积柱状图',
              value: 'stackedBar'
            },
            {
              label: '雷达图',
              value: 'radar'
            },
            {
              label: '散点图',
              value: 'scatter'
            },
            {
              label: '漏斗图',
              value: 'funnel'
            },
            {
              label: '仪表盘',
              value: 'gauge'
            },
            {
              label: '热力图',
              value: 'heatmap'
            },
            {
              label: '桑基图',
              value: 'sankey'
            },
            {
              label: '树图',
              value: 'tree'
            }
          ],
          toolDescription: '选择要生成的图表类型'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'dataInput',
          label: '数据输入',
          description: `简单的数据输入格式（每行一个数据系列，逗号分隔）

多系列折线图/堆积柱状图示例:
产品A,120,132,101,134,90
产品B,220,182,191,234,290

混合图表示例:
120,200,150,80,70
20,30,25,35,40

雷达图示例:
销售,管理,技术,创新
员工A,80,50,90,70
员工B,70,80,60,85

饼图/漏斗图示例:
产品A,30
产品B,45
产品C,25

仪表盘示例:
75,完成率

散点图示例:
10,20,30
15,25,35
20,30,40`,
          required: true,
          toolDescription: '图表数据，使用简单的逗号分隔格式'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'categories',
          label: '分类标签',
          description: '横坐标标签，逗号分隔，如: 1月,2月,3月,4月,5月',
          toolDescription: '横坐标分类标签'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'seriesNames',
          label: '系列名称',
          description: '数据系列名称，逗号分隔，如: 产品A,产品B',
          toolDescription: '数据系列名称'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'colorScheme',
          label: '颜色方案',
          description: '选择图表颜色方案',
          list: [
            {
              label: '蓝色系',
              value: 'blue'
            },
            {
              label: '绿色系',
              value: 'green'
            },
            {
              label: '暖色系',
              value: 'warm'
            },
            {
              label: '冷色系',
              value: 'cool'
            },
            {
              label: '紫色系',
              value: 'purple'
            }
          ],
          toolDescription: '图表颜色方案'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSize',
          label: '图表尺寸',
          description: '选择图表尺寸',
          list: [
            {
              label: '小 (400x300)',
              value: 'small'
            },
            {
              label: '中 (600x450)',
              value: 'medium'
            },
            {
              label: '大 (800x600)',
              value: 'large'
            }
          ],
          toolDescription: '图表尺寸'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'legendPosition',
          label: '图例位置',
          description: '选择图例位置',
          list: [
            {
              label: '顶部',
              value: 'top'
            },
            {
              label: '底部',
              value: 'bottom'
            },
            {
              label: '左侧',
              value: 'left'
            },
            {
              label: '右侧',
              value: 'right'
            }
          ],
          toolDescription: '图例显示位置'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'customOptions',
          label: '高级自定义(可选)',
          description: `高级用户可使用ECharts配置(JSON格式)进行深度定制

示例:
{
  "backgroundColor": "#f8f9fa",
  "title": {
    "textStyle": {
      "color": "#333",
      "fontSize": 20
    }
  }
}

留空则使用默认配置`,
          toolDescription: '高级ECharts配置选项，用于精细调整图表样式'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成的复杂图表URL，可用markdown格式展示：![图表](url)',
          defaultValue: '',
          label: '图表 url',
          key: 'chartUrl'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成图表使用的完整ECharts配置',
          defaultValue: '',
          label: 'ECharts配置',
          key: 'echartsConfig'
        }
      ]
    }
  ]
});

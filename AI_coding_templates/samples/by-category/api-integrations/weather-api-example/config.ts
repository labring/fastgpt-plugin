import type { PluginConfig } from '../../../common/types/plugin';
import { z } from 'zod';

// 输入参数验证模式
export const InputSchema = z.object({
  query: z.string()
    .min(1, '查询内容不能为空')
    .max(100, '查询内容过长')
    .describe('城市名称或经纬度坐标（格式：lat,lon）'),
  
  type: z.enum(['current', 'forecast'])
    .default('current')
    .describe('查询类型：current-当前天气，forecast-天气预报'),
  
  days: z.number()
    .int()
    .min(1)
    .max(7)
    .default(5)
    .describe('预报天数（仅在type为forecast时有效）'),
  
  units: z.enum(['metric', 'imperial', 'kelvin'])
    .default('metric')
    .describe('温度单位：metric-摄氏度，imperial-华氏度，kelvin-开尔文'),
  
  lang: z.string()
    .default('zh')
    .describe('语言代码（zh-中文，en-英文）'),
  
  includeDetails: z.boolean()
    .default(true)
    .describe('是否包含详细信息（湿度、风速、紫外线等）')
});

// 输出结果类型
export const OutputSchema = z.object({
  success: z.boolean().describe('查询是否成功'),
  
  data: z.object({
    location: z.object({
      name: z.string().describe('地点名称'),
      country: z.string().describe('国家'),
      coordinates: z.object({
        lat: z.number().describe('纬度'),
        lon: z.number().describe('经度')
      }).describe('坐标信息')
    }).describe('位置信息'),
    
    current: z.object({
      temperature: z.number().describe('当前温度'),
      feelsLike: z.number().describe('体感温度'),
      humidity: z.number().describe('湿度百分比'),
      pressure: z.number().describe('气压'),
      visibility: z.number().describe('能见度'),
      uvIndex: z.number().describe('紫外线指数'),
      condition: z.object({
        main: z.string().describe('主要天气状况'),
        description: z.string().describe('详细描述'),
        icon: z.string().describe('天气图标代码')
      }).describe('天气状况'),
      wind: z.object({
        speed: z.number().describe('风速'),
        direction: z.number().describe('风向角度'),
        gust: z.number().optional().describe('阵风速度')
      }).describe('风力信息'),
      timestamp: z.string().describe('数据时间戳')
    }).optional().describe('当前天气（type为current时返回）'),
    
    forecast: z.array(z.object({
      date: z.string().describe('日期'),
      temperature: z.object({
        min: z.number().describe('最低温度'),
        max: z.number().describe('最高温度'),
        morning: z.number().describe('早晨温度'),
        day: z.number().describe('白天温度'),
        evening: z.number().describe('傍晚温度'),
        night: z.number().describe('夜晚温度')
      }).describe('温度信息'),
      condition: z.object({
        main: z.string().describe('主要天气状况'),
        description: z.string().describe('详细描述'),
        icon: z.string().describe('天气图标代码')
      }).describe('天气状况'),
      humidity: z.number().describe('湿度百分比'),
      pressure: z.number().describe('气压'),
      wind: z.object({
        speed: z.number().describe('风速'),
        direction: z.number().describe('风向角度')
      }).describe('风力信息'),
      precipitation: z.object({
        probability: z.number().describe('降水概率'),
        amount: z.number().describe('降水量')
      }).describe('降水信息'),
      uvIndex: z.number().describe('紫外线指数')
    })).optional().describe('天气预报（type为forecast时返回）')
  }).describe('天气数据'),
  
  metadata: z.object({
    source: z.string().describe('数据来源'),
    units: z.string().describe('使用的单位系统'),
    language: z.string().describe('返回数据的语言'),
    cacheHit: z.boolean().describe('是否命中缓存'),
    requestTime: z.number().describe('请求耗时（毫秒）'),
    lastUpdated: z.string().describe('数据最后更新时间')
  }).describe('元数据信息'),
  
  error: z.string().optional().describe('错误信息（失败时返回）')
});

export type InputType = z.infer<typeof InputSchema>;
export type OutputType = z.infer<typeof OutputSchema>;

// 插件配置
export const config: PluginConfig = {
  id: 'weather-api-example',
  name: '天气查询',
  description: '查询全球城市的当前天气和天气预报信息',
  avatar: '🌤️',
  author: 'FastGPT',
  version: '1.0.0',
  documentUrl: 'https://doc.fastgpt.in/docs/development/custom-plugin/',
  updateTime: '2024-01-01',
  
  // 工具配置
  toolConfig: {
    customHeaders: {
      'Content-Type': 'application/json'
    }
  },
  
  // 版本列表
  versionList: [
    {
      version: '1.0.0',
      updateTime: '2024-01-01',
      description: '初始版本，支持当前天气和预报查询',
      inputs: [
        {
          key: 'query',
          label: '查询内容',
          description: '输入城市名称或经纬度坐标（格式：纬度,经度）',
          type: 'string',
          required: true,
          placeholder: '例如：北京 或 39.9042,116.4074'
        },
        {
          key: 'type',
          label: '查询类型',
          description: '选择查询当前天气还是天气预报',
          type: 'select',
          required: false,
          defaultValue: 'current',
          options: [
            { label: '当前天气', value: 'current' },
            { label: '天气预报', value: 'forecast' }
          ]
        },
        {
          key: 'days',
          label: '预报天数',
          description: '天气预报的天数（1-7天）',
          type: 'number',
          required: false,
          defaultValue: 5,
          min: 1,
          max: 7
        },
        {
          key: 'units',
          label: '温度单位',
          description: '选择温度显示单位',
          type: 'select',
          required: false,
          defaultValue: 'metric',
          options: [
            { label: '摄氏度 (°C)', value: 'metric' },
            { label: '华氏度 (°F)', value: 'imperial' },
            { label: '开尔文 (K)', value: 'kelvin' }
          ]
        },
        {
          key: 'lang',
          label: '语言',
          description: '返回数据的语言',
          type: 'select',
          required: false,
          defaultValue: 'zh',
          options: [
            { label: '中文', value: 'zh' },
            { label: 'English', value: 'en' },
            { label: '日本語', value: 'ja' },
            { label: '한국어', value: 'ko' }
          ]
        },
        {
          key: 'includeDetails',
          label: '包含详细信息',
          description: '是否包含湿度、风速、紫外线等详细信息',
          type: 'boolean',
          required: false,
          defaultValue: true
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '查询状态',
          description: '查询是否成功',
          type: 'boolean'
        },
        {
          key: 'data',
          label: '天气数据',
          description: '包含位置信息、当前天气或预报数据',
          type: 'object'
        },
        {
          key: 'metadata',
          label: '元数据',
          description: '包含数据来源、单位、语言等信息',
          type: 'object'
        },
        {
          key: 'error',
          label: '错误信息',
          description: '查询失败时的错误描述',
          type: 'string'
        }
      ]
    }
  ]
};
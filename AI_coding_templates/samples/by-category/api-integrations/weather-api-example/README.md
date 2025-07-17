# 天气查询 API 集成示例

这是一个完整的天气查询插件示例，展示了如何集成第三方 API 服务。

## 功能特点

- 🌤️ 支持当前天气和预报查询
- 🌍 支持全球城市天气查询
- 🔄 自动重试和错误处理
- 📊 结构化的天气数据返回
- 🚀 高性能缓存机制
- 🔒 安全的 API 密钥管理

## 支持的功能

### 当前天气
- 实时温度、湿度、风速
- 天气状况描述
- 体感温度
- 紫外线指数

### 天气预报
- 未来7天天气预报
- 每日最高/最低温度
- 降水概率
- 风向风速

### 地理位置
- 城市名称查询
- 经纬度坐标查询
- 自动地理编码

## 使用示例

```typescript
// 查询当前天气
const currentWeather = await tool({
  query: "北京",
  type: "current",
  units: "metric",
  lang: "zh"
});

// 查询天气预报
const forecast = await tool({
  query: "上海",
  type: "forecast",
  days: 7,
  units: "metric",
  lang: "zh"
});

// 使用坐标查询
const weatherByCoords = await tool({
  query: "39.9042,116.4074", // 北京坐标
  type: "current",
  units: "metric"
});
```

## 文件结构

```
weather-api-example/
├── README.md           # 说明文档
├── config.ts          # 插件配置
├── index.ts           # 导出入口
├── package.json       # 依赖配置
├── src/
│   ├── index.ts       # 核心实现
│   ├── types.ts       # 类型定义
│   ├── utils.ts       # 工具函数
│   └── weather-api.ts # API客户端
└── test/
    └── index.test.ts  # 测试用例
```

## 开发要点

### API 集成
- 使用官方天气API（如OpenWeatherMap）
- 实现请求重试和超时处理
- 处理API限制和配额

### 数据处理
- 标准化天气数据格式
- 单位转换（摄氏度/华氏度）
- 多语言支持

### 缓存策略
- 缓存天气数据减少API调用
- 合理的缓存过期时间
- 基于地理位置的缓存键

### 错误处理
- API服务不可用
- 无效的地理位置
- 网络连接问题
- API配额超限
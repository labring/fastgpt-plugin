# 复杂图表测试 - 数据格式说明

## 图表类型和对应数据格式

### 1. 多系列折线图 (multiLine)
```json
{
  "categories": ["1月", "2月", "3月", "4月", "5月"],
  "series": [
    {"name": "产品A", "data": [120, 132, 101, 134, 90]},
    {"name": "产品B", "data": [220, 182, 191, 234, 290]},
    {"name": "产品C", "data": [150, 232, 201, 154, 190]}
  ]
}
```

### 2. 混合图表 (mixed) - 柱状图+折线图
```json
{
  "categories": ["周一", "周二", "周三", "周四", "周五"],
  "barData": [120, 200, 150, 80, 70],
  "lineData": [20, 30, 25, 35, 40]
}
```

### 3. 堆积柱状图 (stackedBar)
```json
{
  "categories": ["Q1", "Q2", "Q3", "Q4"],
  "series": [
    {"name": "移动端", "data": [120, 132, 101, 134]},
    {"name": "PC端", "data": [220, 182, 191, 234]},
    {"name": "其他", "data": [150, 212, 201, 154]}
  ]
}
```

### 4. 雷达图 (radar)
```json
{
  "indicators": [
    {"name": "销售", "max": 100},
    {"name": "管理", "max": 100},
    {"name": "技术", "max": 100},
    {"name": "客服", "max": 100},
    {"name": "研发", "max": 100}
  ],
  "data": [
    {"value": [80, 50, 90, 70, 85], "name": "员工A"},
    {"value": [70, 80, 60, 90, 75], "name": "员工B"}
  ]
}
```

### 5. 散点图 (scatter)
```json
{
  "xAxisName": "身高(cm)",
  "yAxisName": "体重(kg)",
  "data": [
    [161.2, 51.6, 20],
    [167.5, 59.0, 25], 
    [159.5, 49.2, 18],
    [157.0, 63.0, 30],
    [155.8, 53.6, 22]
  ]
}
```
注：数据格式为 [x值, y值, 大小值(可选)]

### 6. 漏斗图 (funnel)
```json
{
  "data": [
    {"value": 100, "name": "访问"},
    {"value": 80, "name": "咨询"},
    {"value": 60, "name": "订单"},
    {"value": 40, "name": "点击"},
    {"value": 20, "name": "购买"}
  ]
}
```

### 7. 仪表盘 (gauge)
```json
{
  "min": 0,
  "max": 100,
  "value": 75,
  "name": "完成率"
}
```

### 8. 热力图 (heatmap)
```json
{
  "xAxis": ["周一", "周二", "周三", "周四", "周五"],
  "yAxis": ["上午", "下午", "晚上"],
  "min": 0,
  "max": 100,
  "data": [
    [0, 0, 15],
    [0, 1, 25], 
    [0, 2, 35],
    [1, 0, 45],
    [1, 1, 55],
    [1, 2, 65],
    [2, 0, 25],
    [2, 1, 35],
    [2, 2, 45]
  ]
}
```
注：数据格式为 [x轴索引, y轴索引, 数值]

### 9. 桑基图 (sankey)
```json
{
  "nodes": [
    {"name": "来源A"},
    {"name": "来源B"}, 
    {"name": "中转1"},
    {"name": "中转2"},
    {"name": "目标"}
  ],
  "links": [
    {"source": "来源A", "target": "中转1", "value": 10},
    {"source": "来源B", "target": "中转1", "value": 15},
    {"source": "中转1", "target": "中转2", "value": 20},
    {"source": "中转2", "target": "目标", "value": 25}
  ]
}
```

### 10. 树图 (tree)
```json
{
  "data": {
    "name": "根节点",
    "children": [
      {
        "name": "分支1",
        "children": [
          {"name": "叶子1-1"},
          {"name": "叶子1-2"}
        ]
      },
      {
        "name": "分支2", 
        "children": [
          {"name": "叶子2-1"},
          {"name": "叶子2-2"},
          {"name": "叶子2-3"}
        ]
      }
    ]
  }
}
```

## 自定义配置示例

### 修改颜色主题
```json
{
  "color": ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
  "backgroundColor": "#f8f9fa"
}
```

### 调整标题样式
```json
{
  "title": {
    "textStyle": {
      "color": "#2c3e50",
      "fontSize": 24,
      "fontWeight": "bold"
    },
    "left": "center",
    "top": 20
  }
}
```

### 自定义图例位置
```json
{
  "legend": {
    "orient": "vertical",
    "right": 10,
    "top": "center",
    "textStyle": {
      "color": "#333"
    }
  }
}
```

### 网格和坐标轴调整
```json
{
  "grid": {
    "left": "10%",
    "right": "10%", 
    "bottom": "15%",
    "top": "15%"
  },
  "xAxis": {
    "axisLabel": {
      "rotate": 45,
      "textStyle": {
        "color": "#666"
      }
    }
  }
}
```
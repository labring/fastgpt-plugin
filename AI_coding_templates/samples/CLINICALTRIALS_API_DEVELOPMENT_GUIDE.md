# ClinicalTrials.gov API 开发指导文档

## 官方文档链接

### 主要API文档
- **官方API文档**: https://clinicaltrials.gov/data-api/api
- **新版现代化API测试环境**: https://beta-ut.clinicaltrials.gov/api/oas/v2.html
- **API主页**: https://clinicaltrials.gov/api/
- **API迁移指南**: https://clinicaltrials.gov/data-api/about-api/api-migration

## API版本概述

### ClinicalTrials.gov API v2.0 (推荐使用)

**重要提醒**: 新版现代化的 ClinicalTrials.gov 数据接入系统即将实施。强烈建议 API 和其他数据用户在测试环境中验证新版API功能。

#### 主要特性
- **REST API架构**: 基于RESTful设计原则
- **OpenAPI 3.0规范**: 使用OpenAPI Specification 3.0描述元信息
- **现代化数据格式**: 减少数据转换负担，提供丰富文本数据
- **第三方库支持**: 支持OpenAPI 3.0库和应用程序集成
- **标准化接口**: 符合现代公共API的标准期望

#### API优势
1. **减少数据转换负担**: 提供更直接的数据格式
2. **减少验证负担**: 简化数据验证流程
3. **丰富文本数据**: 更好地预测、消费和使用富文本数据
4. **现代化标准**: 满足用户对现代公共API的期望

## API端点和基础URL

### 新版API (v2.0)
```
基础URL: https://clinicaltrials.gov/api/v2/studies
测试环境: https://beta-ut.clinicaltrials.gov/api/v2/studies
```

### 经典API (即将废弃)
```
基础URL: https://clinicaltrials.gov/api/query/
注意: 经典API将在2024年6月退役
```

## 主要查询参数

### 研究查询参数
- `query.titles`: 按标题搜索
- `query.conditions`: 按疾病/条件搜索
- `query.interventions`: 按干预措施搜索
- `query.sponsor`: 按赞助商搜索
- `query.locations`: 按地理位置搜索
- `query.phase`: 按试验阶段搜索
- `query.status`: 按研究状态搜索

### 分页参数
- `pageSize`: 每页返回的记录数 (默认10，最大1000)
- `pageToken`: 用于获取下一页的令牌

### 响应格式
- 支持JSON格式响应
- 包含`nextPageToken`用于分页
- 提供结构化的研究数据

## 常用字段列表

### 核心字段
- `NCT Number`: 临床试验注册号
- `Status`: 研究状态
- `Conditions`: 疾病/条件
- `Interventions`: 干预措施
- `Sponsor`: 主要赞助商
- `Study Type`: 研究类型
- `Phase`: 试验阶段
- `Enrollment`: 招募人数
- `Study Start`: 研究开始日期
- `Primary Completion`: 主要完成日期
- `Study Completion`: 研究完成日期

### 详细字段
- `Collaborators`: 合作者
- `Acronym`: 研究简称
- `Outcome Measures`: 结果测量
- `Sex`: 性别要求
- `Age`: 年龄要求
- `Funder type`: 资助类型
- `Study Design`: 研究设计
- `Other IDs`: 其他标识符

## API使用示例

### Python示例 (v2.0 API)
```python
import requests
import json

# 基础查询示例
base_url = "https://clinicaltrials.gov/api/v2/studies"
params = {
    "query.conditions": "diabetes",
    "query.phase": "PHASE2",
    "pageSize": 50
}

response = requests.get(base_url, params=params)
if response.status_code == 200:
    data = response.json()
    studies = data.get('studies', [])
    next_page_token = data.get('nextPageToken')
    
    for study in studies:
        nct_id = study.get('protocolSection', {}).get('identificationModule', {}).get('nctId')
        title = study.get('protocolSection', {}).get('identificationModule', {}).get('briefTitle')
        print(f"NCT ID: {nct_id}, Title: {title}")
else:
    print(f"API请求失败: {response.status_code}")
```

### 分页处理示例
```python
def fetch_all_studies(query_params):
    all_studies = []
    base_url = "https://clinicaltrials.gov/api/v2/studies"
    params = query_params.copy()
    
    while True:
        response = requests.get(base_url, params=params)
        if response.status_code != 200:
            break
            
        data = response.json()
        studies = data.get('studies', [])
        all_studies.extend(studies)
        
        next_page_token = data.get('nextPageToken')
        if not next_page_token:
            break
            
        params['pageToken'] = next_page_token
    
    return all_studies
```

## 数据结构说明

### 响应结构
```json
{
  "studies": [
    {
      "protocolSection": {
        "identificationModule": {
          "nctId": "NCT12345678",
          "briefTitle": "研究标题",
          "officialTitle": "官方完整标题"
        },
        "statusModule": {
          "overallStatus": "RECRUITING",
          "startDateStruct": {
            "date": "2024-01-01",
            "type": "ACTUAL"
          }
        },
        "conditionsModule": {
          "conditions": ["糖尿病", "高血压"]
        },
        "interventionsModule": {
          "interventions": [
            {
              "type": "DRUG",
              "name": "药物名称"
            }
          ]
        }
      }
    }
  ],
  "nextPageToken": "下一页令牌",
  "totalCount": 1000
}
```

## 最佳实践

### 1. 错误处理
- 始终检查HTTP状态码
- 处理API限制和超时
- 实现重试机制

### 2. 性能优化
- 使用适当的pageSize (建议50-100)
- 实现分页逻辑避免超时
- 缓存常用查询结果

### 3. 数据处理
- 验证返回的数据结构
- 处理缺失字段
- 标准化日期格式

### 4. 查询优化
- 使用具体的查询条件减少结果集
- 组合多个过滤器提高精确度
- 避免过于宽泛的查询

## 迁移注意事项

### 从经典API迁移到v2.0
1. **URL结构变化**: 新的端点结构
2. **参数命名**: 查询参数前缀变化 (如 `query.conditions`)
3. **响应格式**: JSON结构重新组织
4. **分页机制**: 使用`pageToken`而非`min_rnk`/`max_rnk`
5. **字段映射**: 某些字段名称和位置发生变化

### 兼容性支持
- 提供迁移指南文档
- 支持遗留端点的现代化API映射
- 过渡期间的双重支持

## 开发建议

### 1. 测试环境使用
- 优先在测试环境 (beta-ut.clinicaltrials.gov) 验证功能
- 测试所有查询参数和响应处理
- 验证分页和错误处理逻辑

### 2. 代码结构
- 创建API客户端类封装请求逻辑
- 实现数据模型类处理响应数据
- 分离查询构建和结果处理逻辑

### 3. 监控和日志
- 记录API调用频率和响应时间
- 监控错误率和失败原因
- 实现请求限制和重试策略

## 相关资源

- **数据元素定义**: 用于提交注册或结果信息的参考
- **研究数据结构文档**: 详细的数据组织说明
- **搜索区域指南**: 不同搜索领域的使用方法
- **CSV下载功能**: 批量数据导出选项
- **OpenAPI规范文档**: 完整的API规范描述

## 更新日志

- **2024年**: API v2.0正式发布
- **2024年4月**: 开始计划的遗留API服务中断
- **2024年6月**: 经典API正式退役

---

**注意**: 本文档基于官方API文档和公开信息整理，建议定期查看官方文档获取最新更新。在实际开发中，请以官方文档为准。
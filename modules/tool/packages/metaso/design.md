# 插件功能
1. 调用metaso api
2. 插件提供api配置输入，激活插件
3. 三种模式：搜索search,问答ask, 读取网页reader

# 参考代码

## 搜索

curl --location 'https://metaso.cn/api/v1/search' \
--header 'Authorization: Bearer mk-42D80172504D147AFAF1960E57385E1C' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--data '{"q":"介绍下小x宝社区和小胰宝项目","scope":"webpage","includeSummary":false,"size":"10"}'

**实际响应格式：**
```json
{
  "credits": 数值,
  "searchParameters": {...},
  "webpages": [
    {
      "title": "标题",
      "url": "链接",
      "snippet": "摘要描述",
      "content": "内容",
      "domain": "域名",
      "date": "发布时间"
    }
  ],
  "total": 总数
}
```

## 问答

```
curl --location 'https://metaso.cn/api/v1/ask' \
--header 'Authorization: Bearer mk-42D80172504D147AFAF1960E57385E1C' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--data '{"q":"谁是这个世界上最美丽的女人","scope":"webpage"}'
```

## 读取网页
```
curl --location 'https://metaso.cn/api/v1/reader' \
--header 'Authorization: Bearer mk-42D80172504D147AFAF1960E57385E1C' \
--header 'Content-Type: application/json' \
--header 'Accept: text/plain' \
--data '{"url":"https://www.163.com/news/article/K56809DQ000189FH.html"}'
```

# 重要说明

## API 密钥格式
- 用户只需输入 `mk-` 开头的密钥部分
- 代码会自动添加 `Bearer ` 前缀构造完整的 Authorization 头

## 响应格式处理
- 搜索 API 返回的数据在 `webpages` 字段中，不是 `results`
- 需要正确映射字段名称：`url`、`snippet`、`content`、`domain`、`date` 等

# 开发参考文档
/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/AI_coding_templates/AI_coding_guide.md 

- 插件代码参考
/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/modules/tool/packages/arxiv

- 支持children功能，参考/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/AI_coding_templates/Children_ToolSet_Development_Guide.md

- 其它参考/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/AI_coding_templates 要求

# 企业微信智能表插件 (WeCom Smart Sheet Plugin)

这是一个功能强大的企业微信智能表管理工具集，专为 FastGPT 设计。它支持从文档创建到子表、视图、字段及记录的全生命周期管理，并提供了“极简”与“高级”两种模式以适应不同的使用场景。

## 核心工具分类

### 1. 文档与结构管理
- **新增智能表 (wecomSmartSheetDoc)**: 在指定空间创建新的智能表格文档。
- **智能表子表管理 (wecomSmartSheetTable)**: 管理文档内的子表，支持新增、删除、更新和获取子表信息。
- **智能表视图管理 (wecomSmartSheetView)**: 支持对子表视图进行增删改查，涵盖表格、看板、画册等多种视图类型。

### 2. 字段管理 (Fields)
- **极简版字段 (wecomSmartSheetFieldSimple)**: 
  - **特点**: 通过下拉选项和简单输入即可创建字段。
  - **自动化**: 自动处理不同字段类型的底层 JSON 结构（如日期、评分等默认配置）。
- **高级版字段 (wecomSmartSheetFieldAdvanced)**: 
  - **特点**: 支持直接输入 JSON 配置。
  - **场景**: 适合需要精细控制字段属性（如特定校验规则、复杂引用等）的高级用户。

### 3. 记录管理 (Records)
- **极简版记录 (wecomSmartSheetRecordSimple)**: 
  - **特点**: 支持直接传入键值对（Field Title: Value）。
  - **自动化**: 自动查询字段类型并进行必要的数据转换（如文本、链接等）。
- **高级版记录 (wecomSmartSheetRecordAdvanced)**: 
  - **特点**: 支持企微原生的记录 JSON 格式。
  - **场景**: 适合批量操作或需要精确控制单元格格式的场景。

## 配置说明

本工具集已优化为**无需手动激活**。您只需要在工作流中提供以下参数：

1.  **accessToken**: 企业微信的调用凭证。
2.  **docid**: 目标智能表的文档 ID（部分创建工具除外）。
3.  **sheet_id**: 目标子表的 ID。

## 快速开始

1.  **创建文档**: 使用 `wecomSmartSheetDoc` 创建一个新表。
2.  **管理结构**: 使用 `wecomSmartSheetTable` 和 `wecomSmartSheetView` 构建您的数据模型。
3.  **配置字段**: 推荐初学者使用 `wecomSmartSheetFieldSimple` 快速添加字段。
4.  **操作数据**: 使用 `wecomSmartSheetRecordSimple` 进行日常的数据录入和查询。

## API 参考

本插件基于企业微信官方 API 构建：
- [智能表概览](https://developer.work.weixin.qq.com/document/path/96601)
- [新增文档 API](https://developer.work.weixin.qq.com/document/path/97464)
- [视图管理 API](https://developer.work.weixin.qq.com/document/path/100199)

---
*由 FastGPT 团队维护*

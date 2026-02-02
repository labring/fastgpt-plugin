# 微信公众号工具集

### 项目结构

```
wechatOfficialAccount/
├── children/
│   └── getAuthToken/           # 获取微信公众号鉴权信息子工具
│       ├── config.ts          # 工具配置文件
│       ├── src/
│       │   └── index.ts       # 工具核心逻辑实现
│       └── test/
│           └── index.test.ts  # 测试文件
├── lib/
│   ├── api.ts                 # 微信公众号 API 定义
│   └── auth.ts                # 通用 API 处理器
├── assets/                    # 静态资源
├── lib/                       # 构建输出目录
├── config.ts                  # 工具集配置
├── index.ts                   # 工具集入口文件
├── package.json               # 包配置
├── DESIGN.md                  # 设计文档
└── README.md                  # 使用说明
```

### 工具集/子工具列表

#### 1. 获取微信公众号鉴权信息 (getAuthToken)
- **功能**: 通过 AppID 和 AppSecret 获取微信公众号的 access_token
- **API**: `GET https://api.weixin.qq.com/cgi-bin/token`
- **输入**: AppID, AppSecret
- **输出**: access_token, expires_in

#### 2. 上传素材 (uploadImage)
- **功能**: 上传图片素材到微信公众号素材库
- **API**: `POST https://api.weixin.qq.com/cgi-bin/media/uploadimg`
- **输入**: access_token, 图片文件
- **输出**: 图片URL

#### 3. 获取素材 media_id (getMaterial)
- **功能**: 根据媒体ID获取素材内容
- **API**: `POST https://api.weixin.qq.com/cgi-bin/material/get_material`
- **输入**: access_token, media_id
- **输出**: 素材内容

#### 4. 发布 markdown 格式的内容到草稿箱 (addDraft)
- **功能**: 将 markdown 格式内容转换为图文素材并添加到草稿箱
- **API**: `POST https://api.weixin.qq.com/cgi-bin/draft/add`
- **输入**: access_token, 文章列表
- **输出**: media_id

#### 5. 获取草稿箱中的内容列表 (batchGetDraft)
- **功能**: 获取草稿箱中的图文列表
- **API**: `POST https://api.weixin.qq.com/cgi-bin/draft/batchget`
- **输入**: access_token, offset, count
- **输出**: 草稿列表

#### 6. 发布草稿箱中的内容 (submitPublish)
- **功能**: 将草稿箱中的内容发布
- **API**: `POST https://api.weixin.qq.com/cgi-bin/freepublish/submit`
- **输入**: access_token, media_id
- **输出**: publish_id, msg_data_id

---

下面由 AI 生成完整的设计文档

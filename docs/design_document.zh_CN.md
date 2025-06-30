## 背景

原先 FastGPT 的系统插件和系统的耦合较强，代码贡献难度较高，现在把这一块的代码移出来解偶，并且在之后可以支持更多模块（不限于系统插件）。

主要有如下的目的：
1. 解耦合，模块化。
2. FastGPT-plugin 可以快速迭代，版本不依赖于 FastGPT
3. 降低开发复杂度（不需要运行 FastGPT 环境）
4. 插件市场

更远期的设想：
1. 以纯代码的形式构建应用
2. 加入其他可以自定义的模块

## 整体架构

1. 使用 ts-rest 作为 RPC 框架进行交互，提供 sdk 供 FastGPT 主项目调用
2. 使用 zod 进行类型验证
3. 用 bun 进行编译，每个工具编译为单一的 `.js` 文件，支持热插拔。

```mermaid
graph LR
A[FastGPT] --> |RESTful API|B[FastGPT-plugin]
B <--> C(Minio)
```

### 项目结构

- **packages**
	- **tool** FastGPT 系统工具
		- **api** 接口实现逻辑
		- **pacakges** 系统工具目录（每一个都是一个 package）
			- getTime
			- dalle3
			- ...
		- **type** 类型定义
		- **utils** 工具
- **scripts** 脚本（编译、创建新工具）
- **sdk**: SDK 定义，供外部调用，发布到了 npm
- **src**: 运行时，express 服务
- **test**: 测试样例

### 系统工具结构

参考 [贡献系统工具]()

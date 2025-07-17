
⏺ 用 Bun 开发时可以直接用 bun test，但更推荐 Vitest 的原因：

  Vitest 优势：
  - 生态兼容性：与 Vite 工具链深度集成，支持 React/Vue/Svelte 等框架特定测试
  - 功能丰富：Mock、fakes、snapshot、DOM 测试、并行执行等完整特性
  - IDE 支持：VS Code 插件、更好的调试体验
  - 配置灵活：支持 Jest 生态的测试配置方式

  Bun test 局限：
  - 相对较新：生态和插件不如 Vitest 成熟
  - 框架集成：对前端框架的测试支持较少
  - 功能简化：为性能优化的功能集可能对复杂测试场景不够

  建议：Bun 开发用 bun test 够简单，但复杂前端项目用 Vitest 更全面。。
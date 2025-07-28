# FastGPT 插件开发模式指南

本文档提供了 FastGPT 插件开发中常用的设计模式和架构模式。

## 设计模式

### 1. 工厂模式 (Factory Pattern)

用于创建不同类型的处理器或工具实例。

```typescript
// 处理器接口
interface IProcessor {
  process(data: any): Promise<any>;
  validate(data: any): boolean;
}

// 具体处理器实现
class TextProcessor implements IProcessor {
  async process(data: string): Promise<any> {
    return {
      type: 'text',
      length: data.length,
      words: data.split(' ').length
    };
  }
  
  validate(data: any): boolean {
    return typeof data === 'string';
  }
}

class JsonProcessor implements IProcessor {
  async process(data: any): Promise<any> {
    const parsed = JSON.parse(data);
    return {
      type: 'json',
      keys: Object.keys(parsed),
      size: JSON.stringify(parsed).length
    };
  }
  
  validate(data: any): boolean {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }
}

class CsvProcessor implements IProcessor {
  async process(data: string): Promise<any> {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    return {
      type: 'csv',
      rows: lines.length - 1,
      columns: headers.length,
      headers
    };
  }
  
  validate(data: any): boolean {
    return typeof data === 'string' && data.includes(',');
  }
}

// 处理器工厂
class ProcessorFactory {
  private static processors = new Map<string, new() => IProcessor>([
    ['text', TextProcessor],
    ['json', JsonProcessor],
    ['csv', CsvProcessor]
  ]);
  
  static create(type: string): IProcessor {
    const ProcessorClass = this.processors.get(type);
    if (!ProcessorClass) {
      throw new Error(`不支持的处理器类型: ${type}`);
    }
    return new ProcessorClass();
  }
  
  static createByData(data: any): IProcessor {
    // 根据数据自动判断类型
    for (const [type, ProcessorClass] of this.processors) {
      const processor = new ProcessorClass();
      if (processor.validate(data)) {
        return processor;
      }
    }
    throw new Error('无法确定数据类型');
  }
  
  static registerProcessor(type: string, processorClass: new() => IProcessor): void {
    this.processors.set(type, processorClass);
  }
}

// 使用示例
export async function processData(data: any, type?: string): Promise<any> {
  try {
    const processor = type 
      ? ProcessorFactory.create(type)
      : ProcessorFactory.createByData(data);
    
    return await processor.process(data);
  } catch (error) {
    throw new Error(`数据处理失败: ${error.message}`);
  }
}
```

### 2. 策略模式 (Strategy Pattern)

用于实现不同的算法或处理策略。

```typescript
// 策略接口
interface IAnalysisStrategy {
  analyze(text: string): Promise<AnalysisResult>;
  getName(): string;
}

// 分析结果类型
interface AnalysisResult {
  strategy: string;
  confidence: number;
  data: any;
}

// 具体策略实现
class KeywordAnalysisStrategy implements IAnalysisStrategy {
  getName(): string {
    return 'keyword';
  }
  
  async analyze(text: string): Promise<AnalysisResult> {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const keywords = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    
    return {
      strategy: this.getName(),
      confidence: 0.8,
      data: { keywords, totalWords: words.length }
    };
  }
}

class SentimentAnalysisStrategy implements IAnalysisStrategy {
  private positiveWords = ['好', '棒', '优秀', '喜欢', '满意', 'good', 'great', 'excellent'];
  private negativeWords = ['坏', '差', '糟糕', '讨厌', '不满', 'bad', 'terrible', 'awful'];
  
  getName(): string {
    return 'sentiment';
  }
  
  async analyze(text: string): Promise<AnalysisResult> {
    const lowerText = text.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    this.positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      positiveScore += matches;
    });
    
    this.negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      negativeScore += matches;
    });
    
    const total = positiveScore + negativeScore;
    const sentiment = total === 0 ? 'neutral' : 
      positiveScore > negativeScore ? 'positive' : 'negative';
    
    return {
      strategy: this.getName(),
      confidence: total > 0 ? 0.7 : 0.3,
      data: {
        sentiment,
        positiveScore,
        negativeScore,
        confidence: total > 0 ? Math.abs(positiveScore - negativeScore) / total : 0
      }
    };
  }
}

class LanguageDetectionStrategy implements IAnalysisStrategy {
  private patterns = {
    zh: /[\u4e00-\u9fff]/,
    en: /[a-zA-Z]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/
  };
  
  getName(): string {
    return 'language';
  }
  
  async analyze(text: string): Promise<AnalysisResult> {
    const scores = Object.entries(this.patterns).map(([lang, pattern]) => {
      const matches = (text.match(new RegExp(pattern.source, 'g')) || []).length;
      return { lang, score: matches / text.length };
    });
    
    const detected = scores.reduce((max, current) => 
      current.score > max.score ? current : max
    );
    
    return {
      strategy: this.getName(),
      confidence: detected.score,
      data: {
        detectedLanguage: detected.lang,
        scores: scores.reduce((acc, { lang, score }) => {
          acc[lang] = score;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  }
}

// 策略上下文
class TextAnalyzer {
  private strategies = new Map<string, IAnalysisStrategy>();
  
  constructor() {
    this.registerStrategy(new KeywordAnalysisStrategy());
    this.registerStrategy(new SentimentAnalysisStrategy());
    this.registerStrategy(new LanguageDetectionStrategy());
  }
  
  registerStrategy(strategy: IAnalysisStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
  }
  
  async analyze(text: string, strategyName?: string): Promise<AnalysisResult[]> {
    if (strategyName) {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        throw new Error(`未找到策略: ${strategyName}`);
      }
      return [await strategy.analyze(text)];
    }
    
    // 执行所有策略
    const results = await Promise.all(
      Array.from(this.strategies.values()).map(strategy => 
        strategy.analyze(text)
      )
    );
    
    return results;
  }
  
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}

// 使用示例
export async function analyzeText(
  text: string, 
  strategy?: string
): Promise<AnalysisResult[]> {
  const analyzer = new TextAnalyzer();
  return await analyzer.analyze(text, strategy);
}
```

### 3. 观察者模式 (Observer Pattern)

用于事件处理和状态变化通知。

```typescript
// 事件类型定义
interface PluginEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

// 观察者接口
interface IEventObserver {
  update(event: PluginEvent): void;
  getInterests(): string[];
}

// 具体观察者实现
class LoggingObserver implements IEventObserver {
  getInterests(): string[] {
    return ['*']; // 监听所有事件
  }
  
  update(event: PluginEvent): void {
    console.log(`[${new Date(event.timestamp).toISOString()}] ${event.type}:`, event.data);
  }
}

class MetricsObserver implements IEventObserver {
  private metrics = new Map<string, number>();
  
  getInterests(): string[] {
    return ['processing.start', 'processing.end', 'error'];
  }
  
  update(event: PluginEvent): void {
    const count = this.metrics.get(event.type) || 0;
    this.metrics.set(event.type, count + 1);
    
    if (event.type === 'processing.end') {
      const duration = event.data.duration;
      const avgKey = 'processing.avg_duration';
      const currentAvg = this.metrics.get(avgKey) || 0;
      const processCount = this.metrics.get('processing.end') || 1;
      const newAvg = (currentAvg * (processCount - 1) + duration) / processCount;
      this.metrics.set(avgKey, newAvg);
    }
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

class ErrorHandlingObserver implements IEventObserver {
  private errorCount = 0;
  private maxErrors = 10;
  
  getInterests(): string[] {
    return ['error', 'warning'];
  }
  
  update(event: PluginEvent): void {
    if (event.type === 'error') {
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        console.error('错误次数过多，可能需要人工干预');
        // 可以触发告警或其他处理
      }
    }
  }
}

// 事件发布者
class EventPublisher {
  private observers: IEventObserver[] = [];
  
  subscribe(observer: IEventObserver): void {
    this.observers.push(observer);
  }
  
  unsubscribe(observer: IEventObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  
  publish(event: PluginEvent): void {
    this.observers.forEach(observer => {
      const interests = observer.getInterests();
      if (interests.includes('*') || interests.includes(event.type)) {
        try {
          observer.update(event);
        } catch (error) {
          console.error('观察者处理事件时出错:', error);
        }
      }
    });
  }
  
  createEvent(type: string, data: any, source: string = 'plugin'): PluginEvent {
    return {
      type,
      data,
      timestamp: Date.now(),
      source
    };
  }
}

// 全局事件管理器
export class EventManager {
  private static instance: EventManager;
  private publisher = new EventPublisher();
  
  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }
  
  subscribe(observer: IEventObserver): void {
    this.publisher.subscribe(observer);
  }
  
  unsubscribe(observer: IEventObserver): void {
    this.publisher.unsubscribe(observer);
  }
  
  emit(type: string, data: any, source?: string): void {
    const event = this.publisher.createEvent(type, data, source);
    this.publisher.publish(event);
  }
  
  // 便捷方法
  emitProcessingStart(data: any): void {
    this.emit('processing.start', data);
  }
  
  emitProcessingEnd(data: any): void {
    this.emit('processing.end', data);
  }
  
  emitError(error: Error, context?: any): void {
    this.emit('error', { error: error.message, context });
  }
  
  emitWarning(message: string, context?: any): void {
    this.emit('warning', { message, context });
  }
}

// 使用示例
export function setupEventHandling(): void {
  const eventManager = EventManager.getInstance();
  
  // 注册观察者
  eventManager.subscribe(new LoggingObserver());
  eventManager.subscribe(new MetricsObserver());
  eventManager.subscribe(new ErrorHandlingObserver());
}
```

### 4. 装饰器模式 (Decorator Pattern)

用于为工具添加额外功能。

```typescript
// 基础工具接口
interface ITool {
  execute(input: any): Promise<any>;
  getName(): string;
}

// 基础工具实现
class BaseTool implements ITool {
  constructor(private name: string) {}
  
  async execute(input: any): Promise<any> {
    // 基础处理逻辑
    return { result: `处理了: ${JSON.stringify(input)}` };
  }
  
  getName(): string {
    return this.name;
  }
}

// 装饰器基类
abstract class ToolDecorator implements ITool {
  constructor(protected tool: ITool) {}
  
  async execute(input: any): Promise<any> {
    return this.tool.execute(input);
  }
  
  getName(): string {
    return this.tool.getName();
  }
}

// 缓存装饰器
class CacheDecorator extends ToolDecorator {
  private cache = new Map<string, any>();
  private ttl: number;
  
  constructor(tool: ITool, ttl: number = 300000) { // 5分钟默认TTL
    super(tool);
    this.ttl = ttl;
  }
  
  async execute(input: any): Promise<any> {
    const key = this.generateCacheKey(input);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return { ...cached.result, fromCache: true };
    }
    
    const result = await super.execute(input);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  private generateCacheKey(input: any): string {
    return `${this.tool.getName()}_${JSON.stringify(input)}`;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// 重试装饰器
class RetryDecorator extends ToolDecorator {
  constructor(
    tool: ITool,
    private maxRetries: number = 3,
    private delay: number = 1000
  ) {
    super(tool);
  }
  
  async execute(input: any): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await super.execute(input);
        if (attempt > 0) {
          console.log(`重试成功，尝试次数: ${attempt + 1}`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          console.log(`第 ${attempt + 1} 次尝试失败，${this.delay}ms 后重试`);
          await this.sleep(this.delay * Math.pow(2, attempt)); // 指数退避
        }
      }
    }
    
    throw new Error(`执行失败，已重试 ${this.maxRetries} 次: ${lastError.message}`);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 验证装饰器
class ValidationDecorator extends ToolDecorator {
  constructor(
    tool: ITool,
    private validator: (input: any) => boolean,
    private errorMessage: string = '输入验证失败'
  ) {
    super(tool);
  }
  
  async execute(input: any): Promise<any> {
    if (!this.validator(input)) {
      throw new Error(this.errorMessage);
    }
    
    return super.execute(input);
  }
}

// 性能监控装饰器
class PerformanceDecorator extends ToolDecorator {
  async execute(input: any): Promise<any> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await super.execute(input);
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const performance = {
        executionTime: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        toolName: this.tool.getName()
      };
      
      console.log('性能指标:', performance);
      
      return {
        ...result,
        performance
      };
    } catch (error) {
      const endTime = performance.now();
      console.log(`工具执行失败 (${endTime - startTime}ms):`, error.message);
      throw error;
    }
  }
}

// 日志装饰器
class LoggingDecorator extends ToolDecorator {
  async execute(input: any): Promise<any> {
    const toolName = this.tool.getName();
    console.log(`[${toolName}] 开始执行，输入:`, input);
    
    try {
      const result = await super.execute(input);
      console.log(`[${toolName}] 执行成功，输出:`, result);
      return result;
    } catch (error) {
      console.error(`[${toolName}] 执行失败:`, error.message);
      throw error;
    }
  }
}

// 工具构建器
export class ToolBuilder {
  private tool: ITool;
  
  constructor(baseTool: ITool) {
    this.tool = baseTool;
  }
  
  withCache(ttl?: number): ToolBuilder {
    this.tool = new CacheDecorator(this.tool, ttl);
    return this;
  }
  
  withRetry(maxRetries?: number, delay?: number): ToolBuilder {
    this.tool = new RetryDecorator(this.tool, maxRetries, delay);
    return this;
  }
  
  withValidation(validator: (input: any) => boolean, errorMessage?: string): ToolBuilder {
    this.tool = new ValidationDecorator(this.tool, validator, errorMessage);
    return this;
  }
  
  withPerformanceMonitoring(): ToolBuilder {
    this.tool = new PerformanceDecorator(this.tool);
    return this;
  }
  
  withLogging(): ToolBuilder {
    this.tool = new LoggingDecorator(this.tool);
    return this;
  }
  
  build(): ITool {
    return this.tool;
  }
}

// 使用示例
export function createEnhancedTool(name: string): ITool {
  const baseTool = new BaseTool(name);
  
  return new ToolBuilder(baseTool)
    .withValidation(
      (input) => input && typeof input === 'object',
      '输入必须是有效的对象'
    )
    .withCache(300000) // 5分钟缓存
    .withRetry(3, 1000) // 最多重试3次，1秒延迟
    .withPerformanceMonitoring()
    .withLogging()
    .build();
}
```

### 5. 责任链模式 (Chain of Responsibility)

用于处理复杂的数据处理流程。

```typescript
// 处理器接口
interface IHandler {
  setNext(handler: IHandler): IHandler;
  handle(request: ProcessingRequest): Promise<ProcessingRequest>;
}

// 处理请求类型
interface ProcessingRequest {
  data: any;
  context: Map<string, any>;
  errors: string[];
  metadata: {
    startTime: number;
    steps: string[];
    [key: string]: any;
  };
}

// 抽象处理器
abstract class AbstractHandler implements IHandler {
  private nextHandler?: IHandler;
  
  setNext(handler: IHandler): IHandler {
    this.nextHandler = handler;
    return handler;
  }
  
  async handle(request: ProcessingRequest): Promise<ProcessingRequest> {
    const result = await this.doHandle(request);
    
    if (this.nextHandler) {
      return this.nextHandler.handle(result);
    }
    
    return result;
  }
  
  protected abstract doHandle(request: ProcessingRequest): Promise<ProcessingRequest>;
  protected abstract getStepName(): string;
  
  protected addStep(request: ProcessingRequest): void {
    request.metadata.steps.push(this.getStepName());
  }
  
  protected addError(request: ProcessingRequest, error: string): void {
    request.errors.push(`[${this.getStepName()}] ${error}`);
  }
}

// 输入验证处理器
class ValidationHandler extends AbstractHandler {
  protected getStepName(): string {
    return 'validation';
  }
  
  protected async doHandle(request: ProcessingRequest): Promise<ProcessingRequest> {
    this.addStep(request);
    
    if (!request.data) {
      this.addError(request, '输入数据为空');
      return request;
    }
    
    if (typeof request.data !== 'string' && typeof request.data !== 'object') {
      this.addError(request, '输入数据类型不支持');
      return request;
    }
    
    // 添加验证通过的标记
    request.context.set('validated', true);
    
    return request;
  }
}

// 数据清洗处理器
class CleaningHandler extends AbstractHandler {
  protected getStepName(): string {
    return 'cleaning';
  }
  
  protected async doHandle(request: ProcessingRequest): Promise<ProcessingRequest> {
    this.addStep(request);
    
    if (!request.context.get('validated')) {
      this.addError(request, '数据未通过验证，跳过清洗步骤');
      return request;
    }
    
    try {
      if (typeof request.data === 'string') {
        // 清洗文本数据
        request.data = request.data
          .trim()
          .replace(/\s+/g, ' ') // 合并多个空格
          .replace(/[^\w\s\u4e00-\u9fff]/g, ''); // 移除特殊字符，保留中文
      } else if (typeof request.data === 'object') {
        // 清洗对象数据
        request.data = this.cleanObject(request.data);
      }
      
      request.context.set('cleaned', true);
    } catch (error) {
      this.addError(request, `数据清洗失败: ${error.message}`);
    }
    
    return request;
  }
  
  private cleanObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = this.cleanObject(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
}

// 数据转换处理器
class TransformationHandler extends AbstractHandler {
  protected getStepName(): string {
    return 'transformation';
  }
  
  protected async doHandle(request: ProcessingRequest): Promise<ProcessingRequest> {
    this.addStep(request);
    
    if (!request.context.get('cleaned')) {
      this.addError(request, '数据未清洗，跳过转换步骤');
      return request;
    }
    
    try {
      // 根据数据类型进行转换
      if (typeof request.data === 'string') {
        request.data = {
          type: 'text',
          content: request.data,
          length: request.data.length,
          words: request.data.split(' ').length
        };
      }
      
      request.context.set('transformed', true);
    } catch (error) {
      this.addError(request, `数据转换失败: ${error.message}`);
    }
    
    return request;
  }
}

// 数据分析处理器
class AnalysisHandler extends AbstractHandler {
  protected getStepName(): string {
    return 'analysis';
  }
  
  protected async doHandle(request: ProcessingRequest): Promise<ProcessingRequest> {
    this.addStep(request);
    
    if (!request.context.get('transformed')) {
      this.addError(request, '数据未转换，跳过分析步骤');
      return request;
    }
    
    try {
      // 执行分析
      const analysis = {
        timestamp: Date.now(),
        dataType: typeof request.data,
        hasErrors: request.errors.length > 0,
        processingSteps: request.metadata.steps.length,
        contextKeys: Array.from(request.context.keys())
      };
      
      request.context.set('analysis', analysis);
      request.context.set('analyzed', true);
    } catch (error) {
      this.addError(request, `数据分析失败: ${error.message}`);
    }
    
    return request;
  }
}

// 结果格式化处理器
class FormattingHandler extends AbstractHandler {
  protected getStepName(): string {
    return 'formatting';
  }
  
  protected async doHandle(request: ProcessingRequest): Promise<ProcessingRequest> {
    this.addStep(request);
    
    try {
      // 格式化最终结果
      const result = {
        success: request.errors.length === 0,
        data: request.data,
        analysis: request.context.get('analysis'),
        metadata: {
          ...request.metadata,
          endTime: Date.now(),
          duration: Date.now() - request.metadata.startTime,
          totalSteps: request.metadata.steps.length
        },
        errors: request.errors
      };
      
      request.data = result;
      request.context.set('formatted', true);
    } catch (error) {
      this.addError(request, `结果格式化失败: ${error.message}`);
    }
    
    return request;
  }
}

// 处理链构建器
export class ProcessingChainBuilder {
  private firstHandler?: IHandler;
  private currentHandler?: IHandler;
  
  addHandler(handler: IHandler): ProcessingChainBuilder {
    if (!this.firstHandler) {
      this.firstHandler = handler;
      this.currentHandler = handler;
    } else {
      this.currentHandler!.setNext(handler);
      this.currentHandler = handler;
    }
    return this;
  }
  
  build(): IHandler {
    if (!this.firstHandler) {
      throw new Error('处理链至少需要一个处理器');
    }
    return this.firstHandler;
  }
}

// 数据处理服务
export class DataProcessingService {
  private processingChain: IHandler;
  
  constructor() {
    this.processingChain = new ProcessingChainBuilder()
      .addHandler(new ValidationHandler())
      .addHandler(new CleaningHandler())
      .addHandler(new TransformationHandler())
      .addHandler(new AnalysisHandler())
      .addHandler(new FormattingHandler())
      .build();
  }
  
  async process(data: any): Promise<any> {
    const request: ProcessingRequest = {
      data,
      context: new Map(),
      errors: [],
      metadata: {
        startTime: Date.now(),
        steps: []
      }
    };
    
    const result = await this.processingChain.handle(request);
    return result.data;
  }
  
  // 创建自定义处理链
  static createCustomChain(handlers: IHandler[]): DataProcessingService {
    const service = new DataProcessingService();
    
    const builder = new ProcessingChainBuilder();
    handlers.forEach(handler => builder.addHandler(handler));
    service.processingChain = builder.build();
    
    return service;
  }
}

// 使用示例
export async function processWithChain(data: any): Promise<any> {
  const service = new DataProcessingService();
  return await service.process(data);
}
```

## 总结

这些设计模式在 FastGPT 插件开发中的应用：

1. **工厂模式**：创建不同类型的处理器
2. **策略模式**：实现可切换的算法
3. **观察者模式**：事件处理和监控
4. **装饰器模式**：为工具添加功能
5. **责任链模式**：复杂的处理流程

选择合适的模式可以：
- 提高代码的可维护性
- 增强系统的扩展性
- 降低模块间的耦合
- 提升代码的复用性

记住：**模式是解决问题的工具，不要为了使用模式而使用模式**。
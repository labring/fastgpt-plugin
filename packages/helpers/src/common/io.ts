// ============================================
// Plugin 通信抽象层
//
// 分层结构：
//   Transport  原始通道，单一总线，负责收发字节
//       ↓
//   Router     按 messageType + method 分发，屏蔽总线细节
//       ↓
//   Handler    具体业务逻辑
// ============================================

// ------ 消息协议 ------

export type PluginMessageType = 'request' | 'response' | 'event' | 'ready' | 'error';

export interface PluginError {
  code: string;
  message: string;
  stack?: string;
}

export interface PluginIOMessage<TParams = unknown, TResult = unknown> {
  id: string;
  messageType: PluginMessageType;
  method?: string;
  params?: TParams;
  result?: TResult;
  error?: PluginError;
  traceId?: string;
  timestamp: number;
}

// ------ 传输层（低层，单一总线）------

export type TransportType = 'ipc' | 'tcp' | 'http';

export interface PluginTransport {
  readonly transportType: TransportType;
  send(message: PluginIOMessage): Promise<void>;
  /** 注册消息处理器，返回取消订阅函数 */
  onMessage(handler: (message: PluginIOMessage) => void): () => void;
  close(): Promise<void>;
}

// ------ Router（按 messageType / method 路由）------

export interface PluginIOContext {
  traceId?: string;
  transportType: TransportType;
}

export type PluginIOHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  context: PluginIOContext
) => TResult | Promise<TResult>;

export interface PluginRouter {
  /** 注册 request handler，method 对应具体操作名 */
  handle<TParams = unknown, TResult = unknown>(
    method: string,
    handler: PluginIOHandler<TParams, TResult>
  ): void;

  /** 注册 event 监听（无响应） */
  on<TData = unknown>(
    event: string,
    handler: (data: TData, context: PluginIOContext) => void
  ): () => void;

  /** 发起 request 并等待 response */
  request<TParams = unknown, TResult = unknown>(
    method: string,
    params: TParams,
    options?: { traceId?: string; timeoutMs?: number }
  ): Promise<TResult>;

  /** 发送单向 event（不等待响应） */
  emit<TData = unknown>(event: string, data: TData): Promise<void>;
}


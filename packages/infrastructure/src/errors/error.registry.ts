import { registerErrors } from '@domain/value-objects/error.vo';

export const ErrorCode = {
  unknown: 'common.unknown',
  operationFailed: 'common.operation_failed',
  badRequest: 'http.bad_request',
  unauthorized: 'http.unauthorized',
  notFound: 'http.not_found',
  validationFailed: 'http.validation_failed',
  internalServerError: 'http.internal_server_error',
  pluginRuntimeManagerDestroyed: 'plugin.runtime.manager_destroyed',
  pluginRuntimeAlreadyRegistered: 'plugin.runtime.already_registered',
  pluginRuntimeReplacementPluginNotFound: 'plugin.runtime.replacement_plugin_not_found',
  pluginRuntimeConfigLoadFailed: 'plugin.runtime.config_load_failed',
  pluginRuntimeConfigUpdateFailed: 'plugin.runtime.config_update_failed',
  pluginRuntimeConfigResetFailed: 'plugin.runtime.config_reset_failed',
  pluginRuntimeConfigInvalid: 'plugin.runtime.config_invalid',
  pluginRuntimePodQuotaExceeded: 'plugin.runtime.pod_quota_exceeded',
  pluginRuntimePluginInfoLoadFailed: 'plugin.runtime.plugin_info_load_failed',
  pluginRuntimeInitializeFailed: 'plugin.runtime.initialize_failed',
  pluginRuntimePluginNotFound: 'plugin.runtime.plugin_not_found',
  pluginRuntimeEventNotSupported: 'plugin.runtime.event_not_supported',
  pluginRuntimeShutdownFailed: 'plugin.runtime.shutdown_failed',
  pluginRemoteDebugDisabled: 'plugin.remote_debug_disabled',
  pluginInvokeFailed: 'plugin.invoke.failed',
  pluginInvokeTimeout: 'plugin.invoke.timeout',
  pluginInvokeQueueTimeout: 'plugin.invoke.queue_timeout',
  connectionGatewayInvalidToken: 'connection_gateway.invalid_token',
  connectionGatewayTokenExpired: 'connection_gateway.token_expired',
  connectionGatewayTransportMismatch: 'connection_gateway.transport_mismatch',
  connectionGatewayCapabilityDenied: 'connection_gateway.capability_denied',
  connectionGatewayStaleGeneration: 'connection_gateway.stale_generation',
  connectionGatewaySessionNotFound: 'connection_gateway.session_not_found',
  connectionGatewaySessionAlreadyBound: 'connection_gateway.session_already_bound',
  connectionGatewaySessionOwnerExpired: 'connection_gateway.session_owner_expired',
  connectionGatewayResourceLimitExceeded: 'connection_gateway.resource_limit_exceeded',
  connectionGatewayEnvelopeTooLarge: 'connection_gateway.envelope_too_large'
} as const;

registerErrors([
  {
    code: ErrorCode.unknown,
    message: 'Unknown error',
    reason: { en: 'Unknown error', 'zh-CN': '未知错误' },
    visibility: 'internal',
    severity: 'unexpected'
  },
  {
    code: ErrorCode.operationFailed,
    message: 'Operation failed',
    reason: { en: 'Operation failed', 'zh-CN': '操作失败' }
  },
  {
    code: ErrorCode.badRequest,
    message: 'Bad Request',
    reason: { en: 'Bad Request', 'zh-CN': '请求参数错误' },
    httpStatus: 400
  },
  {
    code: ErrorCode.unauthorized,
    message: 'Unauthorized',
    reason: { en: 'Unauthorized', 'zh-CN': '未授权' },
    httpStatus: 401
  },
  {
    code: ErrorCode.notFound,
    message: 'Not Found',
    reason: { en: 'Not Found', 'zh-CN': '资源未找到' },
    httpStatus: 404
  },
  {
    code: ErrorCode.validationFailed,
    message: 'Validation failed',
    reason: { en: 'Validation failed', 'zh-CN': '数据校验失败' },
    httpStatus: 400
  },
  {
    code: ErrorCode.internalServerError,
    message: 'Internal Server Error',
    reason: { en: 'Internal Server Error', 'zh-CN': '服务器内部错误' },
    httpStatus: 500,
    visibility: 'internal',
    severity: 'unexpected'
  },
  {
    code: ErrorCode.pluginRuntimeManagerDestroyed,
    message: 'Plugin manager already destroyed',
    reason: { en: 'Plugin manager already destroyed', 'zh-CN': '插件管理器已销毁' }
  },
  {
    code: ErrorCode.pluginRuntimeAlreadyRegistered,
    message: 'Plugin already registered',
    reason: { en: 'Plugin already registered', 'zh-CN': '插件已注册' },
    httpStatus: 409,
    telemetryKind: 'plugin_already_registered'
  },
  {
    code: ErrorCode.pluginRuntimeReplacementPluginNotFound,
    message: 'Replacement plugin not found',
    reason: { en: 'Replacement plugin not found', 'zh-CN': '替换插件未找到' },
    httpStatus: 404
  },
  {
    code: ErrorCode.pluginRuntimeConfigLoadFailed,
    message: 'Failed to get plugin runtime config',
    reason: { en: 'Failed to get plugin runtime config', 'zh-CN': '获取插件运行时配置失败' },
    telemetryKind: 'runtime_config_load_failed'
  },
  {
    code: ErrorCode.pluginRuntimeConfigUpdateFailed,
    message: 'Failed to update plugin runtime config',
    reason: { en: 'Failed to update plugin runtime config', 'zh-CN': '更新插件运行时配置失败' },
    telemetryKind: 'runtime_config_update_failed'
  },
  {
    code: ErrorCode.pluginRuntimeConfigResetFailed,
    message: 'Failed to reset plugin runtime config',
    reason: { en: 'Failed to reset plugin runtime config', 'zh-CN': '重置插件运行时配置失败' },
    telemetryKind: 'runtime_config_reset_failed'
  },
  {
    code: ErrorCode.pluginRuntimeConfigInvalid,
    message: 'Invalid plugin runtime config',
    reason: { en: 'Invalid plugin runtime config', 'zh-CN': '插件运行时配置无效' },
    httpStatus: 400,
    telemetryKind: 'runtime_config_invalid'
  },
  {
    code: ErrorCode.pluginRuntimePodQuotaExceeded,
    message: 'Pod quota exceeded',
    reason: { en: 'Pod quota exceeded', 'zh-CN': 'Pod 配额超出' },
    httpStatus: 429,
    telemetryKind: 'pod_quota_exceeded'
  },
  {
    code: ErrorCode.pluginRuntimePluginInfoLoadFailed,
    message: 'Register plugin error, can not get plugin info',
    reason: {
      en: 'Register plugin error, can not get plugin info',
      'zh-CN': '注册插件失败，无法获取插件信息'
    }
  },
  {
    code: ErrorCode.pluginRuntimeInitializeFailed,
    message: 'Failed to initialize plugin runtime',
    reason: { en: 'Failed to initialize plugin runtime', 'zh-CN': '初始化插件运行时失败' },
    telemetryKind: 'plugin_runtime_initialize_failed'
  },
  {
    code: ErrorCode.pluginRuntimePluginNotFound,
    message: 'Plugin not found',
    reason: { en: 'Plugin not found', 'zh-CN': '插件未找到' },
    httpStatus: 404
  },
  {
    code: ErrorCode.pluginRuntimeEventNotSupported,
    message: 'Event not supported',
    reason: { en: 'Event not supported', 'zh-CN': '不支持的事件' },
    httpStatus: 400
  },
  {
    code: ErrorCode.pluginRuntimeShutdownFailed,
    message: 'Error during shutdown',
    reason: { en: 'Error during shutdown', 'zh-CN': '关闭过程中发生错误' },
    telemetryKind: 'runtime_shutdown_failed'
  },
  {
    code: ErrorCode.pluginRemoteDebugDisabled,
    message: 'Remote debug is disabled',
    reason: {
      en: 'Remote debug is disabled for this Plugin service',
      'zh-CN': '当前 Plugin 服务未启用远程调试功能'
    },
    httpStatus: 400,
    telemetryKind: 'remote_debug_disabled'
  },
  {
    code: ErrorCode.pluginInvokeFailed,
    message: 'Invoke failed',
    reason: { en: 'Invoke failed', 'zh-CN': '调用失败' },
    telemetryKind: 'invoke_failed'
  },
  {
    code: ErrorCode.pluginInvokeTimeout,
    message: 'Plugin invocation timed out',
    reason: { en: 'Plugin invocation timed out', 'zh-CN': '插件调用超时' },
    httpStatus: 504,
    telemetryKind: 'invoke_timeout'
  },
  {
    code: ErrorCode.pluginInvokeQueueTimeout,
    message: 'Plugin invocation waited too long for an available local-pool pod',
    reason: {
      en: 'Plugin invocation waited too long for an available local-pool pod',
      'zh-CN': '插件调用等待空闲本地运行实例超时'
    },
    httpStatus: 503,
    telemetryKind: 'queue_timeout'
  },
  {
    code: ErrorCode.connectionGatewayInvalidToken,
    message: 'Invalid connection token',
    reason: { en: 'Invalid connection token', 'zh-CN': '连接令牌无效' },
    httpStatus: 401,
    telemetryKind: 'connection_gateway_invalid_token'
  },
  {
    code: ErrorCode.connectionGatewayTokenExpired,
    message: 'Connection token expired',
    reason: { en: 'Connection token expired', 'zh-CN': '连接令牌已过期' },
    httpStatus: 401,
    telemetryKind: 'connection_gateway_token_expired'
  },
  {
    code: ErrorCode.connectionGatewayTransportMismatch,
    message: 'Connection token transport mismatch',
    reason: { en: 'Connection token transport mismatch', 'zh-CN': '连接令牌传输类型不匹配' },
    httpStatus: 400,
    telemetryKind: 'connection_gateway_transport_mismatch'
  },
  {
    code: ErrorCode.connectionGatewayCapabilityDenied,
    message: 'Connection token capability denied',
    reason: { en: 'Connection token capability denied', 'zh-CN': '连接令牌缺少能力授权' },
    httpStatus: 403,
    telemetryKind: 'connection_gateway_capability_denied'
  },
  {
    code: ErrorCode.connectionGatewayStaleGeneration,
    message: 'Stale gateway generation',
    reason: { en: 'Stale gateway generation', 'zh-CN': 'Gateway generation 已过期' },
    httpStatus: 409,
    telemetryKind: 'connection_gateway_stale_generation'
  },
  {
    code: ErrorCode.connectionGatewaySessionNotFound,
    message: 'Gateway session not found',
    reason: { en: 'Gateway session not found', 'zh-CN': 'Gateway 会话不存在' },
    httpStatus: 404,
    telemetryKind: 'connection_gateway_session_not_found'
  },
  {
    code: ErrorCode.connectionGatewaySessionAlreadyBound,
    message: 'Gateway session already bound',
    reason: { en: 'Gateway session already bound', 'zh-CN': 'Gateway 会话已存在在线连接' },
    httpStatus: 409,
    telemetryKind: 'connection_gateway_session_already_bound'
  },
  {
    code: ErrorCode.connectionGatewaySessionOwnerExpired,
    message: 'Gateway session owner expired',
    reason: { en: 'Gateway session owner expired', 'zh-CN': 'Gateway 会话 owner 已过期' },
    httpStatus: 409,
    telemetryKind: 'connection_gateway_session_owner_expired'
  },
  {
    code: ErrorCode.connectionGatewayResourceLimitExceeded,
    message: 'Gateway resource limit exceeded',
    reason: { en: 'Gateway resource limit exceeded', 'zh-CN': 'Gateway 资源限制已达到' },
    httpStatus: 429,
    telemetryKind: 'connection_gateway_resource_limit_exceeded'
  },
  {
    code: ErrorCode.connectionGatewayEnvelopeTooLarge,
    message: 'Gateway envelope too large',
    reason: { en: 'Gateway envelope too large', 'zh-CN': 'Gateway 消息体过大' },
    httpStatus: 413,
    telemetryKind: 'connection_gateway_envelope_too_large'
  }
]);

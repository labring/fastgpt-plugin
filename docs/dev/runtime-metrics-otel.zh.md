# Runtime Metrics OpenTelemetry

语言：[简体中文](./runtime-metrics-otel.zh.md) | [English](./runtime-metrics-otel.md)

Runtime metrics 用于生产环境主动推送插件运行时指标。`/api/runtime/metrics` 仍然是单节点调试快照；多节点聚合以 OpenTelemetry backend 为准。

## 启用方式

```text
METRICS_ENABLE_OTEL=true
METRICS_OTEL_SERVICE_NAME=fastgpt-plugin
METRICS_OTEL_URL=http://otel-collector:4318/v1/metrics
SERVICE_INSTANCE_ID=${POD_UID}
DEPLOYMENT_ENVIRONMENT=production
```

`SERVICE_INSTANCE_ID` 应使用 Pod UID、container id 或平台 instance id。为空时进程会生成 opaque id。`HOSTNAME` 只作为可选 `host.name` 资源属性，不作为实例身份的唯一来源。

## 本地 Collector 验证

最小 collector 配置：

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [debug]
```

启动 collector 后，将 server 指向 `http://localhost:4318/v1/metrics`，触发一次 local-pool 插件调用，确认 collector 输出包含：

- `fastgpt.plugin.runtime.invocations.started`
- `fastgpt.plugin.runtime.invocation.duration`
- `fastgpt.plugin.runtime.pods`
- `service.instance.id`

## Backend 查询示例

不同 backend 语法会有差异，以下是 Prometheus 风格示例：

```promql
# RPS
rate(fastgpt_plugin_runtime_invocations_started_total[5m])

# error rate
rate(fastgpt_plugin_runtime_invocations_failed_total[5m])
/
rate(fastgpt_plugin_runtime_invocations_started_total[5m])

# p95 latency
histogram_quantile(
  0.95,
  rate(fastgpt_plugin_runtime_invocation_duration_bucket[5m])
)

# queue pressure
fastgpt_plugin_runtime_queue_length > 0

# pod saturation
fastgpt_plugin_runtime_pods{state="busy"}
/
fastgpt_plugin_runtime_service_max_pods

# pod crashes
rate(fastgpt_plugin_runtime_pod_crashes_total[5m])
```

## 两节点验收

1. 在 staging 启动一个 collector。
2. 启动一个 server 节点，设置唯一 `SERVICE_INSTANCE_ID`。
3. 触发成功调用和失败调用，确认 backend 有该实例的 metrics。
4. 启动第二个 server 节点，设置不同 `SERVICE_INSTANCE_ID`。
5. 两个节点都触发调用。
6. 确认 backend 可以按 `service.instance.id` 分组，也可以按 `plugin.id` 聚合。
7. 确认 `/api/runtime/metrics` 仍只显示当前命中节点状态。

## Rollback

如果 metrics 影响业务路径：

```text
METRICS_ENABLE_OTEL=false
```

重启 server 后验证插件调用恢复。Collector 或 backend 故障本身不需要回滚应用；metrics exporter failure 不应影响插件调用。

如果 backend 出现高 cardinality 或成本异常：

```text
METRICS_INCLUDE_PLUGIN_ETAG=false
```

同时检查后端是否出现了 request id、invocation id、user id、team id、payload、file path 或 raw error message 这类不允许的 label。

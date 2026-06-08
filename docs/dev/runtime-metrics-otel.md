# Runtime Metrics OpenTelemetry

Language: [简体中文](./runtime-metrics-otel.zh.md) | [English](./runtime-metrics-otel.md)

Runtime metrics proactively push plugin runtime metrics in production. `/api/runtime/metrics` remains a single-node debugging snapshot. Multi-node aggregation should use the OpenTelemetry backend.

## Enablement

```text
METRICS_ENABLE_OTEL=true
METRICS_OTEL_SERVICE_NAME=fastgpt-plugin
METRICS_OTEL_URL=http://otel-collector:4318/v1/metrics
SERVICE_INSTANCE_ID=${POD_UID}
DEPLOYMENT_ENVIRONMENT=production
```

`SERVICE_INSTANCE_ID` should use a Pod UID, container id, or platform instance id. If it is empty, the process generates an opaque id. `HOSTNAME` is only used as an optional `host.name` resource attribute, not as the unique source of instance identity.

## Local Collector Verification

Minimal collector config:

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

After starting the collector, point the server to `http://localhost:4318/v1/metrics`, trigger one local-pool plugin invocation, and confirm the collector output contains:

- `fastgpt.plugin.runtime.invocations.started`
- `fastgpt.plugin.runtime.invocation.duration`
- `fastgpt.plugin.runtime.pods`
- `service.instance.id`

## Backend Query Examples

Backend syntax differs. These examples use Prometheus-style queries:

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

## Two-Node Acceptance

1. Start a collector in staging.
2. Start one server node and set a unique `SERVICE_INSTANCE_ID`.
3. Trigger a successful call and a failed call, then confirm the backend has metrics for that instance.
4. Start a second server node and set a different `SERVICE_INSTANCE_ID`.
5. Trigger calls on both nodes.
6. Confirm the backend can group by `service.instance.id` and aggregate by `plugin.id`.
7. Confirm `/api/runtime/metrics` still shows only the state of the node that handled the request.

## Rollback

If metrics affect the business path:

```text
METRICS_ENABLE_OTEL=false
```

Restart the server and verify plugin calls recover. Collector or backend failures alone should not require an application rollback; metrics exporter failures should not affect plugin calls.

If the backend shows high cardinality or abnormal cost:

```text
METRICS_INCLUDE_PLUGIN_ETAG=false
```

Also check whether the backend contains disallowed labels such as request id, invocation id, user id, team id, payload, file path, or raw error message.

import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { SignozBaseURL, SignozServiceName } from '../constants/signoz';
import { resourceFromAttributes } from '@opentelemetry/resources';
import type { Logger } from '@opentelemetry/api-logs';
import { registerOTel, OTLPHttpJsonTraceExporter } from '@vercel/otel';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { addLog } from './log';
import { metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// global metrics
const metricExporter = new OTLPMetricExporter({
  url: `${SignozBaseURL}/v1/metrics`
});

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 5000
    })
  ]
});

metrics.setGlobalMeterProvider(meterProvider);

const meter = meterProvider.getMeter(SignozServiceName);
const toolIdCounter = meter.createCounter('tool_execution_count', {
  description: 'Count of tool executions by toolId'
});
const toolExecutionStatusCounter = meter.createCounter('tool_execution_status', {
  description: 'Count of tool executions by status (success/error)'
});

export const getLogger = () => {
  if (!global.logger) {
    if (!SignozBaseURL) {
      return null;
    }

    try {
      const otlpExporter = new OTLPLogExporter({
        url: `${SignozBaseURL}/v1/logs`,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const loggerProvider = new LoggerProvider({
        processors: [new SimpleLogRecordProcessor(otlpExporter)],
        resource: resourceFromAttributes({
          'service.name': SignozServiceName
        })
      });

      global.logger = loggerProvider.getLogger('default');
      addLog.info('Logger initialized successfully');
    } catch (error) {
      addLog.error('Failed to initialize logger:', error);
      return null;
    }
  }

  return global.logger;
};

// record tool execution metrics
export const recordToolExecution = (toolId: string, status: 'success' | 'error') => {
  try {
    if (!toolIdCounter || !toolExecutionStatusCounter) {
      addLog.warn('Metrics not initialized, skipping metric recording', {
        toolId,
        status,
        hasToolIdCounter: !!toolIdCounter,
        hasToolExecutionStatusCounter: !!toolExecutionStatusCounter
      });
      return;
    }

    toolIdCounter.add(1, { tool_id: toolId, service: SignozServiceName });
    toolExecutionStatusCounter.add(1, { tool_id: toolId, status, service: SignozServiceName });

    addLog.info('Metrics recorded', { toolId, status });
  } catch (error) {
    addLog.error('Failed to record metrics:', error);
  }
};

export function connectSignoz() {
  if (!SignozBaseURL) {
    addLog.info('SignOz not configured, skipping monitoring setup');
    return;
  }

  addLog.info(`Connecting signoz, ${SignozBaseURL}, ${SignozServiceName}`);

  try {
    const result = registerOTel({
      serviceName: SignozServiceName,
      traceExporter: new OTLPHttpJsonTraceExporter({
        url: `${SignozBaseURL}/v1/traces`
      }),

      instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()]
    });

    addLog.info('Signoz connected successfully');
    return result;
  } catch (error) {
    addLog.error('Failed to connect to Signoz:', error);
    throw error;
  }
}

declare global {
  var logger: Logger;
}

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
import type { Counter, Attributes } from '@opentelemetry/api';

class Signoz {
  private static toolIdCounter: Counter<Attributes> | undefined;
  private static toolExecutionStatusCounter: Counter<Attributes> | undefined;

  public static initializeMetrics(baseURL: string, serviceName: string) {
    const metricExporter = new OTLPMetricExporter({
      url: `${baseURL}/v1/metrics`
    });

    const meterProvider = new MeterProvider({
      readers: [
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 1000
        })
      ]
    });

    metrics.setGlobalMeterProvider(meterProvider);

    const meter = meterProvider.getMeter(serviceName);
    this.toolIdCounter = meter.createCounter('tool_execution_count', {
      description: 'Count of tool executions by toolId'
    });
    this.toolExecutionStatusCounter = meter.createCounter('tool_execution_status', {
      description: 'Count of tool executions by status (success/error)'
    });
  }

  public static recordToolExecution(
    toolId: string,
    status: 'success' | 'error',
    serviceName: string
  ) {
    try {
      if (this.toolIdCounter && this.toolExecutionStatusCounter) {
        this.toolIdCounter.add(1, { tool_id: toolId, service: serviceName });
        this.toolExecutionStatusCounter.add(1, { tool_id: toolId, status, service: serviceName });
      } else {
        addLog.warn('Metrics not initialized, skipping metric recording');
      }
    } catch (error) {
      addLog.error('Failed to record metrics:', error);
    }
  }
}

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
  Signoz.recordToolExecution(toolId, status, SignozServiceName);
  addLog.info('Metrics recorded', { toolId, status });
};

export function connectSignoz() {
  if (!SignozBaseURL) {
    addLog.debug('SignOz not configured, skipping monitoring setup');
    return;
  }

  addLog.info(`Connecting signoz, ${SignozBaseURL}, ${SignozServiceName}`);

  try {
    Signoz.initializeMetrics(SignozBaseURL, SignozServiceName);

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
  }
}

declare global {
  var logger: Logger;
}

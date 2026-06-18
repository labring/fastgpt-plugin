import { Readable } from 'node:stream';

import FCClient, {
  CreateFunctionInput,
  CreateFunctionRequest,
  CustomContainerConfig,
  GetFunctionRequest,
  InvokeFunctionHeaders,
  InvokeFunctionRequest,
  PutConcurrencyConfigRequest,
  PutConcurrencyInput,
  UpdateFunctionInput,
  UpdateFunctionRequest,
  VPCConfig
} from '@alicloud/fc20230330';
import { $OpenApiUtil } from '@alicloud/openapi-core';

import { FC_REQUEST_PROTOCOL } from './const';
import { parseFCInvokeFrames } from './fc-function-invoker';
import type {
  FCFunctionDefinition,
  FCFunctionEnsureResult,
  FCFunctionInvokeInput,
  FCFunctionInvokeResult,
  FCFunctionProvider,
  FCFunctionRecord
} from './types';

export type FCAliyunFunctionProviderDeps = {
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  vpcId?: string;
  vSwitchIds?: string[];
  securityGroupId?: string;
};

export class FCAliyunFunctionProvider implements FCFunctionProvider {
  private readonly client: FCClient;

  constructor(private readonly deps: FCAliyunFunctionProviderDeps) {
    this.client = new FCClient(
      new $OpenApiUtil.Config({
        regionId: deps.region,
        endpoint: deps.endpoint,
        accessKeyId: deps.accessKeyId,
        accessKeySecret: deps.accessKeySecret
      })
    );
  }

  async getFunction(functionName: string): Promise<FCFunctionRecord | null> {
    try {
      const response = await this.client.getFunction(functionName, new GetFunctionRequest({}));
      const body = response.body;
      if (!body) {
        return null;
      }

      return {
        uniqueId: { pluginId: '', version: '', etag: '' },
        runtimeId: body.environmentVariables?.FASTGPT_RUNTIME_ID ?? '',
        functionName: body.functionName ?? functionName,
        image: body.customContainerConfig?.image ?? '',
        roleArn: body.role ?? '',
        artifact: {
          bucket: body.environmentVariables?.PLUGIN_ARTIFACT_BUCKET ?? '',
          key: body.environmentVariables?.PLUGIN_ARTIFACT_KEY ?? ''
        },
        config: {
          minInstances: 0,
          maxConcurrency: body.instanceConcurrency ?? 1,
          timeoutMs: (body.timeout ?? 120) * 1000,
          memorySize: body.memorySize ?? 1024,
          cpu: body.cpu ?? 1,
          maxQueueSize: 500,
          queueTimeoutMs: 60000,
          invocationMode: 'openapi-buffered'
        },
        env: body.environmentVariables ?? {},
        updatedAt: body.lastModifiedTime ? Date.parse(body.lastModifiedTime) : Date.now(),
        state: body.state
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async ensureFunction(definition: FCFunctionDefinition): Promise<FCFunctionEnsureResult> {
    const existing = await this.getFunction(definition.functionName);
    const body = this.toFunctionInput(definition);

    if (!existing) {
      const response = await this.client.createFunction(
        new CreateFunctionRequest({
          body: new CreateFunctionInput({
            ...body,
            functionName: definition.functionName
          })
        })
      );
      await this.putConcurrency(definition);
      return {
        state: 'created',
        function: this.toFunctionRecord(definition, response.body?.state)
      };
    }

    if (!isFunctionDrifted(existing, definition)) {
      await this.putConcurrency(definition);
      return {
        state: 'unchanged',
        function: existing
      };
    }

    const response = await this.client.updateFunction(
      definition.functionName,
      new UpdateFunctionRequest({
        body: new UpdateFunctionInput(body)
      })
    );
    await this.putConcurrency(definition);

    return {
      state: 'updated',
      function: this.toFunctionRecord(definition, response.body?.state)
    };
  }

  async deleteFunction(functionName: string): Promise<void> {
    try {
      await this.client.deleteFunction(functionName);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  async invoke<P = unknown, R = unknown>(
    input: FCFunctionInvokeInput<P>
  ): Promise<FCFunctionInvokeResult<R>> {
    const body = JSON.stringify({
      protocol: FC_REQUEST_PROTOCOL,
      invocationId: input.invocationId,
      eventName: input.eventName,
      returnStream: input.returnStream,
      payload: input.payload
    });
    const response = await this.client.invokeFunctionWithOptions(
      input.functionName,
      new InvokeFunctionRequest({
        body: Readable.from(body)
      }),
      new InvokeFunctionHeaders({
        xFcInvocationType: 'Sync',
        commonHeaders: {
          'content-type': 'application/json',
          'x-fastgpt-runtime-id': input.runtimeId,
          'x-fastgpt-invocation-id': input.invocationId
        }
      }),
      {
        readTimeout: input.timeoutMs,
        connectTimeout: 10_000,
        toMap: () => ({ readTimeout: input.timeoutMs, connectTimeout: 10_000 })
      }
    );

    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(`FC InvokeFunction failed: ${response.statusCode}`);
    }

    const text = await readBody(response.body);
    return {
      frames: parseFCInvokeFrames(text)
    };
  }

  private async putConcurrency(definition: FCFunctionDefinition): Promise<void> {
    if (definition.config.reservedConcurrency === undefined) {
      return;
    }

    await this.client.putConcurrencyConfig(
      definition.functionName,
      new PutConcurrencyConfigRequest({
        body: new PutConcurrencyInput({
          reservedConcurrency: definition.config.reservedConcurrency
        })
      })
    );
  }

  private toFunctionInput(definition: FCFunctionDefinition) {
    return {
      runtime: 'custom-container',
      handler: 'index.handler',
      role: definition.roleArn,
      cpu: definition.config.cpu,
      memorySize: definition.config.memorySize,
      timeout: Math.ceil(definition.config.timeoutMs / 1000),
      instanceConcurrency: definition.config.maxConcurrency,
      internetAccess: true,
      environmentVariables: {
        ...definition.env,
        FASTGPT_RUNTIME_ID: definition.runtimeId
      },
      customContainerConfig: new CustomContainerConfig({
        image: definition.image,
        port: 9000
      }),
      vpcConfig: this.toVpcConfig()
    };
  }

  private toVpcConfig(): VPCConfig | undefined {
    if (!this.deps.vpcId && !this.deps.securityGroupId && !this.deps.vSwitchIds?.length) {
      return undefined;
    }

    return new VPCConfig({
      vpcId: this.deps.vpcId,
      securityGroupId: this.deps.securityGroupId,
      vSwitchIds: this.deps.vSwitchIds
    });
  }

  private toFunctionRecord(
    definition: FCFunctionDefinition,
    state: string | undefined
  ): FCFunctionRecord {
    return {
      ...definition,
      updatedAt: Date.now(),
      state
    };
  }
}

function isFunctionDrifted(existing: FCFunctionRecord, next: FCFunctionDefinition): boolean {
  return (
    existing.image !== next.image ||
    existing.roleArn !== next.roleArn ||
    existing.artifact.bucket !== next.artifact.bucket ||
    existing.artifact.key !== next.artifact.key ||
    existing.config.maxConcurrency !== next.config.maxConcurrency ||
    existing.config.timeoutMs !== next.config.timeoutMs ||
    existing.config.memorySize !== next.config.memorySize ||
    existing.config.cpu !== next.config.cpu ||
    Object.entries(next.env).some(([key, value]) => existing.env[key] !== value)
  );
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  const statusCode = record.statusCode ?? record.status;
  const code = String(record.code ?? record.name ?? '');
  return statusCode === 404 || /notfound|not_found|FunctionNotFound/i.test(code);
}

async function readBody(body: Readable | undefined): Promise<string> {
  if (!body) {
    return '';
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

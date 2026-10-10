import z from 'zod';

import { PluginTypeEnum, type PluginTypeType } from '@domain/entities/plugin-base.entity';
import type { InvokePort } from '@domain/ports/invoke.port';
import {
  type ModerationCheckInputType,
  ModerationCheckPayloadSchema,
  ModerationResultSchema,
  type ModerationResultType
} from '@domain/value-objects/moderation.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import { PluginChannelHostMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';
import { getErrText } from '@shared/utils/err';

import { InvokeClient } from './invoke.client';
import type { UserModerationManifestType } from './manifest.type';
import { PluginFactory } from './plugin-factory';

/**
 * 适配器返回的结果：`provider` 与 `keywords` 由 factory 权威填充，适配器不提供，
 * 因此这里把它们排除在契约之外（避免适配器被迫填一个会被覆盖的占位值）。
 */
export type ModerationProviderResultType = Omit<ModerationResultType, 'keywords' | 'provider'>;

/** Author-declared flat secrets schema. Undefined means secrets pass through unchanged. */
export type ModerationSecretSchema = z.ZodObject<any> | undefined;

/**
 * Derive `ctx.secrets` from the schema output type when declared; otherwise use a raw record.
 * This matches runtime behavior: validate only when declared, and never parse or strip otherwise.
 */
type ModerationSecretValue<TSecret extends ModerationSecretSchema> = TSecret extends z.ZodTypeAny
  ? z.output<NoInfer<TSecret>>
  : Record<string, unknown>;

export type ModerationProviderContext<TSecret extends ModerationSecretSchema = undefined> = {
  secrets: ModerationSecretValue<TSecret>;
  systemVar: SystemVarType;
  invoke: InvokePort;
  /** 构造标准 error 档结果（provider 无法判定时由适配器主动调用） */
  moderationError: (message: string) => ModerationProviderResultType;
};

export type ModerationProvider<TSecret extends ModerationSecretSchema = undefined> = {
  /** provider 标识，写入 manifest.meta.provider */
  name: string;
  /** provider 文档地址 */
  docUrl?: string;
  /**
   * 同步审查。provider 无法判定时**必须**返回 `verdict: 'error'` 的结果，
   * 而不是抛异常——抛出的异常会被当作框架级失败（编码 bug 与「provider 不可用」要能区分）。
   */
  check: (
    input: ModerationCheckInputType,
    ctx: ModerationProviderContext<TSecret>
  ) => Promise<ModerationProviderResultType>;
};

export class ModerationFactory extends PluginFactory {
  /**
   * 作者是否声明过 secretSchema。与 getSecretSchema() 的返回值语义不同：后者在缺省时要返回
   * z.object({}) 供构建期生成 JSON Schema，而用它去 safeParse 会把整份配置 strip 成 {}。
   */
  private secretSchema: z.ZodObject<any> | undefined;

  private constructor(
    private userModerationManifest: UserModerationManifestType,
    private provider: ModerationProvider<any>
  ) {
    super();

    if (this.mode)
      this.getChannel().setRequestHandler(async (msg) => {
        if (msg.method === PluginChannelHostMethod.request && msg.params.eventName === 'check') {
          return this.getChannel().createReply(undefined, {
            output: this.handleCheck(msg.params.payload, msg.traceId)
          });
        }
        return;
      });
  }

  /** 声明 secretSchema：顶层键由作者自定，嵌套可被 zod strip 是刻意行为 */
  public setSecretSchema(schema: z.ZodObject<any>): void {
    this.secretSchema = schema;
  }

  public static getInstance(
    userModerationManifest: UserModerationManifestType,
    provider: ModerationProvider<any>,
    secretSchema?: z.ZodObject<any>
  ): ModerationFactory {
    const factory = new ModerationFactory(userModerationManifest, provider);
    if (secretSchema) {
      factory.setSecretSchema(secretSchema);
    }
    return factory;
  }

  public getPluginType(): PluginTypeType {
    return PluginTypeEnum.moderation;
  }

  /** 缺省时返回 z.object({})，仅为让构建期 z.toJSONSchema 有输入 */
  public getSecretSchema(): z.ZodType<any> {
    return this.secretSchema ?? z.object({});
  }

  public getUserModerationManifest(): UserModerationManifestType {
    return this.userModerationManifest;
  }

  public getProvider(): ModerationProvider<any> {
    return this.provider;
  }

  private handleCheck(payload: unknown, traceId?: string): StreamData<PluginStreamMessageType> {
    const output = StreamData.create<PluginStreamMessageType>();

    void (async () => {
      try {
        const parsed = ModerationCheckPayloadSchema.safeParse(payload);
        if (!parsed.success) {
          output.send({
            type: 'error',
            data: JSON.stringify(parsed.error.issues)
          });
          return;
        }

        const { input, secrets, systemVar } = parsed.data;

        let resolvedSecrets: Record<string, unknown>;
        if (this.secretSchema) {
          const secretsResult = this.secretSchema.safeParse(secrets ?? {});
          if (!secretsResult.success) {
            output.send({
              type: 'error',
              data: JSON.stringify(secretsResult.error.issues)
            });
            return;
          }
          resolvedSecrets = secretsResult.data;
        } else {
          resolvedSecrets = secrets ?? {};
        }

        const raw = await this.provider.check(input, {
          secrets: resolvedSecrets,
          systemVar,
          invoke: new InvokeClient(this.getChannel(), {
            invocationId: traceId
          }),
          moderationError: (message) => ({
            verdict: 'error',
            hits: [],
            errorMessage: message
          })
        });

        // provider 与 keywords 在 parse 之前由 factory 权威填充：
        // keywords 是 hits[].keywords 的派生投影，派生规则只有这一份。
        const keywords = [...new Set(raw.hits.flatMap((hit) => hit.keywords ?? []))];
        const result = ModerationResultSchema.parse({
          ...raw,
          keywords,
          provider: this.provider.name
        });

        output.send({ type: 'response', data: result });
      } catch (err) {
        output.send({
          type: 'error',
          data: getErrText(err, 'Unknown error during moderation')
        });
      } finally {
        output.end();
      }
    })();

    return output;
  }
}

export const defineModeration = <TSecretSchema extends ModerationSecretSchema = undefined>({
  manifest,
  secretSchema,
  provider
}: {
  manifest: UserModerationManifestType;
  secretSchema?: TSecretSchema;
  provider: ModerationProvider<TSecretSchema>;
}): ModerationFactory => {
  return ModerationFactory.getInstance(manifest, provider, secretSchema);
};

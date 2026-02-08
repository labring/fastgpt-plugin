import type { FileMetadata } from '../common/schemas/s3';
import type { StreamMessageType } from '../tools/schemas/req';
import type { Cherrio2MdInput, Cherrio2MdResult, FileInput } from './schemas';
import {
  InvokeTypeEnum,
  type InvokeGetWecomCropTokenResponseType,
  type InvokeTeamInfoResponseType,
  type InvokeTypeEnumType,
  type InvokeUserInfoResponseType
} from '@fastgpt-sdk/invoke';

export type {};

// 使用泛型约束 type 和 data 的关系
export type InvokeInput<T extends InvokeTypeEnumType = InvokeTypeEnumType> = {
  type: T;
  data: object;
};

export type InvokeOutput<T = InvokeTypeEnumType> = T extends typeof InvokeTypeEnum.getUserInfo
  ? InvokeUserInfoResponseType
  : T extends typeof InvokeTypeEnum.getTeamInfo
    ? InvokeTeamInfoResponseType
    : T extends typeof InvokeTypeEnum.getWecomCorpToken
      ? InvokeGetWecomCropTokenResponseType
      : T extends typeof InvokeTypeEnum.getWecomCorpInfo
        ? never
        : never;

export interface EventEmitter {
  uploadFile(input: FileInput): Promise<FileMetadata>;
  streamResponse(input: StreamMessageType): void;
  html2md(data: { html: string }): Promise<string>;
  cherrio2md(input: Cherrio2MdInput): Promise<Cherrio2MdResult>;
  invoke<T extends InvokeTypeEnumType>(input: InvokeInput<T>): Promise<InvokeOutput<T>>;
}

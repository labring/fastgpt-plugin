import type {
  CoworkerdWorkerLimitsType
} from '@domain/entities/plugin-coworkerd.entity';

export type CoworkerdApiErrorResponse = {
  code: string;
  reason: string;
};

export type CoworkerdStatusResponse = {
  apiserver?: {
    version?: string;
    instance?: string;
    startedAt?: string;
  };
  caller?: {
    scope?: string;
    tenant?: string;
  };
  storage?: { tenantsRevision?: string };
  nodes?: {
    nodeId: string;
    state?: string;
    reachable?: boolean;
    drain?: { draining?: boolean };
    storage?: { appliedTenantsRevision?: string };
  }[];
  [key: string]: unknown;
};

export type CoworkerdTenantResponse = {
  name: string;
  state?: string;
  quotas?: Record<string, unknown>;
  defaultLimits?: CoworkerdWorkerLimitsType;
  [key: string]: unknown;
};

export type CoworkerdVersionUploadResponse = {
  versionId: string;
  active: boolean;
  record?: {
    trial?: {
      enabled?: boolean;
      atActivation?: boolean;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type CoworkerdRoute = {
  host: string;
  pathPrefix: string;
};

export type { CoworkerdPluginConfigType } from '@domain/entities/plugin-coworkerd.entity';

export type CoworkerdWorkerResponse = {
  workerId: string;
  activeVersion: string | null;
  valid: boolean;
  versions: { versionId: string; contentHash: string }[];
};

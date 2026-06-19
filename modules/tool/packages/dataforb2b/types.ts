import type { FilterCondition, FilterGroup } from './client';

/** POST /search/people and /search/companies request body. */
export interface SearchRequest {
  filters: FilterGroup | FilterCondition;
  count?: number;
  offset?: number;
  enrich_live?: boolean;
}

export interface SearchResponse {
  total?: number;
  count?: number;
  results?: Record<string, unknown>[];
  applied_filters?: unknown;
  credits_used?: number;
  [key: string]: unknown;
}

/** POST /search/reasoning request body. */
export interface ReasoningRequest {
  query?: string;
  session_id?: string;
  answers?: Record<string, unknown>;
  category?: 'people' | 'companies';
  max_results?: number;
  enrich_live?: boolean;
}

export interface ReasoningResponse {
  status?: string;
  session_id?: string;
  questions?: Array<{ id: string; text: string; suggestions?: unknown[] }>;
  total?: number;
  count?: number;
  results?: Record<string, unknown>[];
  applied_filters?: unknown;
  credits_used?: number;
  [key: string]: unknown;
}

/** POST /enrich/profile request body. */
export interface EnrichProfileRequest {
  profile_identifier: string;
  enrich_profile?: boolean;
  enrich_work_email?: boolean;
  enrich_personal_email?: boolean;
  enrich_phone?: boolean;
  enrich_github?: boolean;
}

/** POST /enrich/company request body. */
export interface EnrichCompanyRequest {
  company_identifier: string;
}

/** GET /typeahead response. */
export interface TypeaheadResponse {
  results?: Array<{ value?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

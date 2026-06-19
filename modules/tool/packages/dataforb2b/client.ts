import axios, { type AxiosInstance, AxiosError } from 'axios';

export const DATAFORB2B_API_BASE = 'https://api.dataforb2b.ai';

/**
 * Create an HTTP client for the DataForB2B API.
 * Authentication uses the `api_key` request header (key from app.dataforb2b.ai).
 */
export function createDataForB2BClient(apiKey: string): AxiosInstance {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('DataForB2B API key is required. Get it from app.dataforb2b.ai.');
  }
  return axios.create({
    baseURL: DATAFORB2B_API_BASE,
    headers: {
      api_key: apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });
}

/** Turn any API/network error into a readable, single-line message. */
export function handleDataForB2BError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const body = axiosError.response.data;
      const detail =
        (body && (body.error || body.message)) || axiosError.message || 'Unknown error';
      switch (status) {
        case 401:
          return 'Invalid or missing DataForB2B API key (401 unauthorized).';
        case 403:
          return `This API key does not have permission for this resource (403 forbidden): ${detail}`;
        case 429:
          return `Rate limit exceeded (429). Please wait before making more requests: ${detail}`;
        case 400:
          return `Invalid request (400): ${detail}`;
        case 500:
        case 502:
        case 503:
          return `DataForB2B server error (${status}): ${detail}. Please try again later.`;
        default:
          return `DataForB2B API error (${status}): ${detail}`;
      }
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your network connection.';
    }
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      return 'Network error: cannot reach the DataForB2B API. Please check your connection.';
    }
    return `Network error: ${axiosError.message}`;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred while calling the DataForB2B API';
}

/* -------------------------------------------------------------------------- */
/*  Filter helpers (ported from the canonical DataForB2B Dify plugin)          */
/* -------------------------------------------------------------------------- */

export type FilterCondition = {
  column: string;
  type: string;
  value: unknown;
  value2?: unknown;
};

export type FilterGroup = {
  op: 'and' | 'or';
  conditions: Array<FilterCondition | FilterGroup>;
};

/** Accept either an already-parsed object/array or a JSON string. */
export function parseJsonParam(value: unknown, name: string): unknown {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new Error(`Invalid JSON for '${name}': ${(e as Error).message}`);
    }
  }
  return value;
}

/** Coerce a filter value string into bool/number when it clearly is one. */
export function coerceScalar(value: unknown): unknown {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const s = String(value).trim();
  const low = s.toLowerCase();
  if (low === 'true') return true;
  if (low === 'false') return false;
  const f = Number(s);
  if (s !== '' && !Number.isNaN(f)) return Number.isInteger(f) ? f : f;
  return s;
}

/**
 * Build one filter condition from a generic slot (column, operator, value).
 * Returns undefined when the slot is empty (so it is skipped).
 *  - `in`/`not_in` -> comma-separated list
 *  - `between`     -> "min,max" (two comma-separated values)
 *  - `like`/`not_like` -> raw text pattern kept as-is
 *  - others        -> single value, coerced to bool/number when applicable
 */
export function buildSlotCondition(
  column: unknown,
  operator: unknown,
  raw: unknown
): FilterCondition | undefined {
  if (!column || raw === null || raw === undefined || String(raw).trim() === '') {
    return undefined;
  }
  const col = String(column).trim();
  const op = (operator ? String(operator).trim() : '=') || '=';

  if (op === 'in' || op === 'not_in') {
    const items = String(raw)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length === 0) return undefined;
    return { column: col, type: op, value: items.map(coerceScalar) };
  }

  if (op === 'between') {
    const parts = String(raw)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length < 2) {
      throw new Error(`Operator 'between' on '${col}' needs two comma-separated values, e.g. 3,7`);
    }
    return {
      column: col,
      type: 'between',
      value: coerceScalar(parts[0]),
      value2: coerceScalar(parts[1])
    };
  }

  if (op === 'like' || op === 'not_like') {
    return { column: col, type: op, value: String(raw) };
  }

  return { column: col, type: op, value: coerceScalar(raw) };
}

/** Combine slot conditions (with AND/OR) and optional advanced JSON filters. */
export function finalizeFilters(
  conditions: FilterCondition[],
  match: unknown,
  advanced: unknown
): FilterGroup | FilterCondition | undefined {
  let op = match ? String(match).trim().toLowerCase() : 'and';
  if (op !== 'and' && op !== 'or') op = 'and';

  const group: FilterGroup | undefined =
    conditions.length > 0 ? { op: op as 'and' | 'or', conditions: [...conditions] } : undefined;

  if (advanced) {
    let adv: FilterGroup;
    if (typeof advanced === 'object' && advanced !== null && 'conditions' in (advanced as object)) {
      adv = advanced as FilterGroup;
    } else if (Array.isArray(advanced)) {
      adv = { op: 'and', conditions: advanced as FilterCondition[] };
    } else {
      adv = { op: 'and', conditions: [advanced as FilterCondition] };
    }
    return group ? { op: 'and', conditions: [group, adv] } : adv;
  }

  return group;
}

/** Collect filter slots + advanced JSON from a tool input object into filters. */
export function buildFilters(input: Record<string, unknown>, numSlots = 5) {
  const conditions: FilterCondition[] = [];
  for (let i = 1; i <= numSlots; i++) {
    const cond = buildSlotCondition(
      input[`filter_${i}_column`],
      input[`filter_${i}_operator`],
      input[`filter_${i}_value`]
    );
    if (cond) conditions.push(cond);
  }
  const advanced = parseJsonParam(input.advanced_filters, 'advanced_filters');
  return finalizeFilters(conditions, input.match, advanced);
}

import { format } from 'date-fns';
import { z } from 'zod';

// Modified version (fixed)
const KlineTypeEnum = z
  .union([
    z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
    z.number().int().min(1).max(10)
  ])
  .transform((val) => (typeof val === 'string' ? Number(val) : val));

const AdjustTypeEnum = z
  .union([z.enum(['0', '1']), z.number().int().min(0).max(1)])
  .transform((val) => (typeof val === 'string' ? Number(val) : val));

// Input parameter schema
export const InputType = z.object({
  token: z.string().min(1, 'Please provide a valid API token'),
  code: z.string().min(1, 'Please provide product code, e.g.: 857.HK'),
  kline_type: KlineTypeEnum.describe(
    'K-line type: 1=1min, 2=5min, 3=15min, 4=30min, 5=1hour, 6=2hour, 7=4hour, 8=daily, 9=weekly, 10=monthly'
  ),
  query_kline_num: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100)
    .describe('Number of K-lines to query, maximum 500'),
  kline_timestamp_end: z
    .number()
    .int()
    .optional()
    .default(0)
    .describe('End timestamp, 0 means latest trading day'),
  adjust_type: AdjustTypeEnum.optional()
    .default(0)
    .describe('Adjustment type: 0=ex-rights, 1=forward adjustment'),
  is_stock: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether it is a stock product, determines which API endpoint to use')
});

// K-line data item schema
const KlineItemType = z.object({
  timestamp: z.string().describe('Timestamp'),
  open_price: z.string().describe('Open price'),
  close_price: z.string().describe('Close price'),
  high_price: z.string().describe('High price'),
  low_price: z.string().describe('Low price'),
  volume: z.string().describe('Volume'),
  turnover: z.string().optional().describe('Turnover')
});

// API response schema
const ApiResponseType = z.object({
  ret: z.number(),
  msg: z.string(),
  trace: z.string(),
  data: z
    .object({
      code: z.string(),
      kline_type: z.number(),
      kline_list: z.array(KlineItemType)
    })
    .optional()
});

// Output parameter schema
export const OutputType = z.object({
  data: z
    .object({
      code: z.string(),
      kline_type: z.number(),
      kline_list: z.array(KlineItemType),
      total_count: z.number()
    })
    .optional()
});

// Generate unique trace code
function generateTrace(): string {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}`;
}

// Build query parameters
function buildQueryData(params: z.infer<typeof InputType>) {
  return {
    trace: generateTrace(),
    data: {
      code: params.code,
      kline_type: params.kline_type,
      kline_timestamp_end: params.kline_timestamp_end,
      query_kline_num: params.query_kline_num,
      adjust_type: params.adjust_type
    }
  };
}

// Get API endpoint URL
function getApiEndpoint(isStock: boolean): string {
  if (isStock) {
    return 'https://quote.alltick.io/quote-stock-b-api/kline';
  } else {
    return 'https://quote.alltick.io/quote-b-api/kline';
  }
}

export async function tool(params: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // Validate input parameters
    const validatedParams = InputType.parse(params);

    // Build request data
    const queryData = buildQueryData(validatedParams);
    const apiUrl = getApiEndpoint(validatedParams.is_stock);

    // Build complete request URL
    const requestUrl = `${apiUrl}?token=${encodeURIComponent(validatedParams.token)}&query=${encodeURIComponent(JSON.stringify(queryData))}`;

    // Send API request
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FastGPT-AllTick-Plugin/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    // Validate API response format
    const validatedResponse = ApiResponseType.parse(responseData);

    // Check API return status
    if (validatedResponse.ret !== 200) {
      return Promise.reject(
        new Error(`API error: ${validatedResponse.msg} (error code: ${validatedResponse.ret})`)
      );
    }

    // Check if data exists
    if (!validatedResponse.data || !validatedResponse.data.kline_list) {
      return Promise.reject(
        new Error('Failed to retrieve K-line data, please check if the product code is correct')
      );
    }

    // Return success result
    return {
      data: {
        code: validatedResponse.data.code,
        kline_type: validatedResponse.data.kline_type,
        kline_list: validatedResponse.data.kline_list,
        total_count: validatedResponse.data.kline_list.length
      }
    };
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return Promise.reject(new Error(`Parameter validation failed: ${errorMessages}`));
    }

    if (error instanceof Error) {
      return Promise.reject(new Error(`Request failed: ${error.message}`));
    }

    return Promise.reject(new Error('Unknown error, please try again later'));
  }
}
